/**
 * Standalone Seed Script: Updates MongoDB collections with the 8 new Spin Wheel offers.
 * Removes old offers and updates the wheel segments and campaign.
 *
 * Usage:
 *   node scripts/seed-offers.js
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const NEW_OFFERS = [
  {
    name: 'Free Frame',
    discountType: 'freebie',
    discountValue: 0,
    description: 'Get a stylish complimentary frame with your purchase.',
    terms: 'Valid on select frame collections. Cannot be combined with other offers.',
    color: '#E53E3E',
    isActive: true,
  },
  {
    name: 'Buy One Get One',
    discountType: 'freebie',
    discountValue: 0,
    description: 'Buy one pair of spectacles or frame and get one free!',
    terms: 'Free item applies to equal or lesser value. Terms and conditions apply.',
    color: '#DD6B20',
    isActive: true,
  },
  {
    name: '15% Offer on Spectical',
    discountType: 'percentage',
    discountValue: 15,
    description: 'Flat 15% discount on complete spectacles.',
    terms: 'Valid on frames and lenses. Applicable at store checkout.',
    color: '#D69E2E',
    isActive: true,
  },
  {
    name: '30% Offer on Spectical',
    discountType: 'percentage',
    discountValue: 30,
    description: 'Enjoy a huge 30% discount on spectacles.',
    terms: 'Valid on select spectacle packages and lens combos.',
    color: '#38A169',
    isActive: true,
  },
  {
    name: '10% On Branded Frames',
    discountType: 'percentage',
    discountValue: 10,
    description: 'Exclusive 10% discount on all premium international branded frames.',
    terms: 'Valid on leading designer and branded optical frames.',
    color: '#319795',
    isActive: true,
  },
  {
    name: 'Free Blue Ray Protection Coating',
    discountType: 'freebie',
    discountValue: 0,
    description: 'Free Blue Ray protection filter coating on your lenses for eye comfort.',
    terms: 'Applicable on any prescription or computer lens purchase.',
    color: '#3182CE',
    isActive: true,
  },
  {
    name: 'Old Frame Exchange Offer',
    discountType: 'fixed',
    discountValue: 500,
    description: 'Exchange your old frame and get an instant value discount on your new pair.',
    terms: 'Bring any old eyewear frame to the store to claim exchange value.',
    color: '#805AD5',
    isActive: true,
  },
  {
    name: '30% Offer in Drive Safe Lens',
    discountType: 'percentage',
    discountValue: 30,
    description: 'Flat 30% discount on Drive Safe precision anti-reflective lenses.',
    terms: 'Valid on certified Drive Safe day & night driving lenses.',
    color: '#D53F8C',
    isActive: true,
  },
];

async function seed() {
  const mongoUri =
    process.env.MONGODB_URI || 'mongodb://localhost:27017/eyeland-spinwin';

  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB successfully.');

  const db = mongoose.connection.db;

  // 1. Remove old offers
  const deleteResult = await db.collection('offers').deleteMany({});
  console.log(`Removed ${deleteResult.deletedCount} old offers from 'offers' collection.`);

  // 2. Insert new 8 offers
  const now = new Date();
  const docsToInsert = NEW_OFFERS.map((offer) => ({
    ...offer,
    currentUses: 0,
    createdAt: now,
    updatedAt: now,
  }));

  const insertResult = await db.collection('offers').insertMany(docsToInsert);
  console.log(`Inserted ${insertResult.insertedCount} new offers:`);

  const insertedOffers = await db.collection('offers').find().toArray();
  insertedOffers.forEach((o, index) => {
    console.log(`  ${index + 1}. [${o.discountType.toUpperCase()}] ${o.name} (${o.color})`);
  });

  // 3. Build 8 segments with 12.5% equal probability each (total 100%)
  const segments = insertedOffers.map((o) => ({
    offerId: o._id,
    label: o.name,
    color: o.color,
    probability: 12.5,
  }));

  // 4. Update or create Wheel
  let wheel = await db.collection('wheels').findOne({ isActive: true });
  if (!wheel) {
    wheel = await db.collection('wheels').findOne();
  }

  let wheelId;
  if (wheel) {
    await db.collection('wheels').updateOne(
      { _id: wheel._id },
      {
        $set: {
          title: 'THE EYE LAND Lucky Spin',
          subtitle: 'Spin to win exciting discounts and free gifts!',
          segments,
          isActive: true,
          updatedAt: now,
        },
      },
    );
    wheelId = wheel._id;
    console.log(`Updated existing wheel (${wheelId}) with 8 segments.`);
  } else {
    const createdWheel = await db.collection('wheels').insertOne({
      title: 'THE EYE LAND Lucky Spin',
      subtitle: 'Spin to win exciting discounts and free gifts!',
      segments,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    wheelId = createdWheel.insertedId;
    console.log(`Created new wheel (${wheelId}) with 8 segments.`);
  }

  // 5. Update or create active Campaign
  let campaign = await db.collection('campaigns').findOne({ isActive: true });
  if (!campaign) {
    campaign = await db.collection('campaigns').findOne();
  }

  if (campaign) {
    await db.collection('campaigns').updateOne(
      { _id: campaign._id },
      {
        $set: {
          wheelId: wheelId,
          isActive: true,
          updatedAt: now,
        },
      },
    );
    console.log(`Updated campaign (${campaign._id}) to point to wheel (${wheelId}).`);
  } else {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const createdCampaign = await db.collection('campaigns').insertOne({
      name: 'Grand Store Spin & Win 2026',
      description: 'Exclusive in-store customer reward campaign for THE EYE LAND.',
      startDate,
      endDate,
      wheelId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created new campaign (${createdCampaign.insertedId}) with wheel (${wheelId}).`);
  }

  console.log('\n--- SUCCESS: MongoDB collections updated with 8 new offers for Spin Wheel! ---');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error seeding offers:', err);
  process.exit(1);
});
