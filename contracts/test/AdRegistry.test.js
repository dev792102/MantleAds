const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('AdRegistry', function () {
  let AdRegistry;
  let adRegistry;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy contract
    AdRegistry = await ethers.getContractFactory('AdRegistry');
    adRegistry = await AdRegistry.deploy();
    await adRegistry.waitForDeployment();
  });

  describe('Deployment', function () {
    it('Should set the right owner', async function () {
      expect(await adRegistry.owner()).to.equal(owner.address);
    });
  });

  describe('Ad Submission', function () {
    it('Should submit an ad successfully', async function () {
      const slotId = 'header-banner';
      const contentUrl = 'https://example.com/ad.jpg';
      const contentType = 'image';
      const description = 'Test ad';
      const price = ethers.parseEther('0.25');
      const duration = 3600; // 1 hour

      await expect(
        adRegistry.connect(user1).submitAd(
          slotId,
          contentUrl,
          contentType,
          description,
          price,
          duration
        )
      )
        .to.emit(adRegistry, 'AdSubmitted')
        .withArgs(1, user1.address, slotId, price, duration);

      const submissions = await adRegistry.getUserAdSubmissions(user1.address);
      expect(submissions.length).to.equal(1);
      expect(submissions[0].slotId).to.equal(slotId);
      expect(submissions[0].userWallet).to.equal(user1.address);
    });

    it('Should reject empty slot ID', async function () {
      await expect(
        adRegistry.connect(user1).submitAd(
          '',
          'https://example.com/ad.jpg',
          'image',
          'Test ad',
          ethers.parseEther('0.25'),
          3600
        )
      ).to.be.revertedWith('Slot ID cannot be empty');
    });

    it('Should reject zero price', async function () {
      await expect(
        adRegistry.connect(user1).submitAd(
          'header-banner',
          'https://example.com/ad.jpg',
          'image',
          'Test ad',
          0,
          3600
        )
      ).to.be.revertedWith('Price must be greater than 0');
    });
  });

  describe('Payment Recording', function () {
    it('Should record payment by owner', async function () {
      const amount = ethers.parseEther('0.25');
      const currency = 'MNT';
      const transactionHash = '0x1234567890abcdef';
      const network = 'Mantle Sepolia';

      await expect(
        adRegistry.recordPayment(
          user1.address,
          amount,
          currency,
          transactionHash,
          network
        )
      )
        .to.emit(adRegistry, 'PaymentRecorded')
        .withArgs(user1.address, amount, currency, transactionHash);

      const payments = await adRegistry.getUserPayments(user1.address);
      expect(payments.length).to.equal(1);
      expect(payments[0].amount).to.equal(amount);
      expect(payments[0].currency).to.equal(currency);
    });

    it('Should reject payment recording by non-owner', async function () {
      await expect(
        adRegistry.connect(user1).recordPayment(
          user2.address,
          ethers.parseEther('0.25'),
          'MNT',
          '0x1234567890abcdef',
          'Mantle Sepolia'
        )
      ).to.be.revertedWith('Only owner can call this function');
    });
  });

  describe('Ad Deactivation', function () {
    beforeEach(async function () {
      // Submit an ad first
      await adRegistry.connect(user1).submitAd(
        'header-banner',
        'https://example.com/ad.jpg',
        'image',
        'Test ad',
        ethers.parseEther('0.25'),
        3600
      );
    });

    it('Should deactivate ad by owner', async function () {
      await expect(adRegistry.deactivateAd(1))
        .to.emit(adRegistry, 'AdDeactivated')
        .withArgs(1, user1.address);

      const ad = await adRegistry.getAdById(1);
      expect(ad.isActive).to.equal(false);
    });

    it('Should deactivate ad by ad owner', async function () {
      await expect(adRegistry.connect(user1).deactivateAd(1))
        .to.emit(adRegistry, 'AdDeactivated')
        .withArgs(1, user1.address);

      const ad = await adRegistry.getAdById(1);
      expect(ad.isActive).to.equal(false);
    });

    it('Should reject deactivation by non-owner', async function () {
      await expect(adRegistry.connect(user2).deactivateAd(1))
        .to.be.revertedWith('Not authorized');
    });
  });

  describe('Data Retrieval', function () {
    beforeEach(async function () {
      // Submit multiple ads
      await adRegistry.connect(user1).submitAd(
        'header-banner',
        'https://example.com/ad1.jpg',
        'image',
        'Test ad 1',
        ethers.parseEther('0.25'),
        3600
      );

      await adRegistry.connect(user1).submitAd(
        'sidebar',
        'https://example.com/ad2.jpg',
        'video',
        'Test ad 2',
        ethers.parseEther('0.15'),
        7200
      );

      // Record payments
      await adRegistry.recordPayment(
        user1.address,
        ethers.parseEther('0.25'),
        'MNT',
        '0x1234567890abcdef',
        'Mantle Sepolia'
      );
    });

    it('Should get user ad submissions', async function () {
      const submissions = await adRegistry.getUserAdSubmissions(user1.address);
      expect(submissions.length).to.equal(2);
      expect(submissions[0].slotId).to.equal('header-banner');
      expect(submissions[1].slotId).to.equal('sidebar');
    });

    it('Should get user payments', async function () {
      const payments = await adRegistry.getUserPayments(user1.address);
      expect(payments.length).to.equal(1);
      expect(payments[0].amount).to.equal(ethers.parseEther('0.25'));
    });

    it('Should get user ad count', async function () {
      const count = await adRegistry.getUserAdCount(user1.address);
      expect(count).to.equal(2);
    });

    it('Should get user total payments', async function () {
      const total = await adRegistry.getUserTotalPayments(user1.address);
      expect(total).to.equal(ethers.parseEther('0.25'));
    });

    it('Should get active ads', async function () {
      const activeAds = await adRegistry.getUserActiveAds(user1.address);
      expect(activeAds.length).to.equal(2); // Both ads are active initially
    });
  });
});