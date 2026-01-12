// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AdRegistry
 * @dev Contract for storing ad submission details and payment records for users
 */
contract AdRegistry {
    struct AdSubmission {
        uint256 id;
        address userWallet;
        string slotId;
        string contentUrl;
        string contentType;
        string description;
        uint256 price;
        uint256 duration;
        uint256 submittedAt;
        uint256 expiresAt;
        uint256 paidAt;
        string transactionHash;
        bool isActive;
        bool isPaid;
    }

    struct PaymentRecord {
        uint256 amount;
        uint256 timestamp;
        string currency;
        string transactionHash;
        string network;
    }

    // State variables
    mapping(address => AdSubmission[]) private userAdSubmissions;
    mapping(address => PaymentRecord[]) private userPayments;
    mapping(uint256 => AdSubmission) private adSubmissionsById;

    uint256 private nextAdId = 1;
    address public owner;

    // Events
    event AdSubmitted(
        uint256 indexed adId,
        address indexed userWallet,
        string slotId,
        uint256 price,
        uint256 duration
    );

    event AdPaid(uint256 indexed adId, address indexed userWallet, string transactionHash);

    event PaymentRecorded(
        address indexed userWallet,
        uint256 amount,
        string currency,
        string transactionHash
    );

    event AdDeactivated(uint256 indexed adId, address indexed userWallet);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Submit a new ad
     * @param _slotId The ad slot identifier
     * @param _contentUrl URL to the ad content
     * @param _contentType Type of content (image, video, text, etc.)
     * @param _description Description of the ad
     * @param _price Price in wei/smallest unit
     * @param _duration Duration in seconds
     */
    function submitAd(
        string memory _slotId,
        string memory _contentUrl,
        string memory _contentType,
        string memory _description,
        uint256 _price,
        uint256 _duration
    ) external {
        require(bytes(_slotId).length > 0, "Slot ID cannot be empty");
        require(bytes(_contentUrl).length > 0, "Content URL cannot be empty");
        require(_price > 0, "Price must be greater than 0");
        require(_duration > 0, "Duration must be greater than 0");

        uint256 adId = nextAdId++;
        uint256 submittedAt = block.timestamp;
        uint256 expiresAt = submittedAt + _duration;

        AdSubmission memory newAd = AdSubmission({
            id: adId,
            userWallet: msg.sender,
            slotId: _slotId,
            contentUrl: _contentUrl,
            contentType: _contentType,
            description: _description,
            price: _price,
            duration: _duration,
            submittedAt: submittedAt,
            expiresAt: expiresAt,
            paidAt: 0,
            transactionHash: "",
            isActive: true,
            isPaid: false
        });

        userAdSubmissions[msg.sender].push(newAd);
        adSubmissionsById[adId] = newAd;

        emit AdSubmitted(adId, msg.sender, _slotId, _price, _duration);
    }

    /**
     * @dev Record a payment made by a user
     * @param _userWallet The user's wallet address
     * @param _amount Amount paid
     * @param _currency Currency used (e.g., "MNT", "USDC")
     * @param _transactionHash Transaction hash
     * @param _network Network name
     */
    function recordPayment(
        address _userWallet,
        uint256 _amount,
        string memory _currency,
        string memory _transactionHash,
        string memory _network
    ) external onlyOwner {
        require(_userWallet != address(0), "Invalid user wallet");
        require(_amount > 0, "Amount must be greater than 0");
        require(bytes(_transactionHash).length > 0, "Transaction hash cannot be empty");

        PaymentRecord memory payment = PaymentRecord({
            amount: _amount,
            timestamp: block.timestamp,
            currency: _currency,
            transactionHash: _transactionHash,
            network: _network
        });

        userPayments[_userWallet].push(payment);

        emit PaymentRecorded(_userWallet, _amount, _currency, _transactionHash);
    }

    /**
     * @dev Mark an ad as paid
     * @param _adId The ad ID to mark as paid
     * @param _transactionHash The payment transaction hash
     */
    function markAdAsPaid(uint256 _adId, string memory _transactionHash) external onlyOwner {
        AdSubmission storage ad = adSubmissionsById[_adId];
        require(ad.id != 0, "Ad does not exist");
        require(!ad.isPaid, "Ad is already paid");

        ad.isPaid = true;
        ad.paidAt = block.timestamp;
        ad.transactionHash = _transactionHash;

        emit AdPaid(_adId, ad.userWallet, _transactionHash);
    }

    /**
     * @dev Deactivate an ad
     * @param _adId The ad ID to deactivate
     */
    function deactivateAd(uint256 _adId) external {
        AdSubmission storage ad = adSubmissionsById[_adId];
        require(ad.id != 0, "Ad does not exist");
        require(ad.userWallet == msg.sender || msg.sender == owner, "Not authorized");

        ad.isActive = false;
        emit AdDeactivated(_adId, ad.userWallet);
    }

    /**
     * @dev Get all ad submissions for a user
     * @param _userWallet The user's wallet address
     * @return Array of ad submissions
     */
    function getUserAdSubmissions(address _userWallet)
        external
        view
        returns (AdSubmission[] memory)
    {
        return userAdSubmissions[_userWallet];
    }

    /**
     * @dev Get all payment records for a user
     * @param _userWallet The user's wallet address
     * @return Array of payment records
     */
    function getUserPayments(address _userWallet)
        external
        view
        returns (PaymentRecord[] memory)
    {
        return userPayments[_userWallet];
    }

    /**
     * @dev Get ad submission by ID
     * @param _adId The ad ID
     * @return The ad submission details
     */
    function getAdById(uint256 _adId)
        external
        view
        returns (AdSubmission memory)
    {
        require(adSubmissionsById[_adId].id != 0, "Ad does not exist");
        return adSubmissionsById[_adId];
    }

    /**
     * @dev Get total number of ads submitted by a user
     * @param _userWallet The user's wallet address
     * @return Total count of ads
     */
    function getUserAdCount(address _userWallet)
        external
        view
        returns (uint256)
    {
        return userAdSubmissions[_userWallet].length;
    }

    /**
     * @dev Get total payments made by a user
     * @param _userWallet The user's wallet address
     * @return Total amount paid
     */
    function getUserTotalPayments(address _userWallet)
        external
        view
        returns (uint256)
    {
        PaymentRecord[] memory payments = userPayments[_userWallet];
        uint256 total = 0;
        for (uint256 i = 0; i < payments.length; i++) {
            total += payments[i].amount;
        }
        return total;
    }

    /**
     * @dev Get active ads for a user
     * @param _userWallet The user's wallet address
     * @return Array of active ad IDs
     */
    function getUserActiveAds(address _userWallet)
        external
        view
        returns (uint256[] memory)
    {
        AdSubmission[] memory userAds = userAdSubmissions[_userWallet];
        uint256 activeCount = 0;

        // First pass: count active ads
        for (uint256 i = 0; i < userAds.length; i++) {
            if (userAds[i].isActive && userAds[i].expiresAt > block.timestamp) {
                activeCount++;
            }
        }

        // Second pass: collect active ad IDs
        uint256[] memory activeAdIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < userAds.length; i++) {
            if (userAds[i].isActive && userAds[i].expiresAt > block.timestamp) {
                activeAdIds[index] = userAds[i].id;
                index++;
            }
        }

        return activeAdIds;
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Invalid new owner");
        owner = _newOwner;
    }
}