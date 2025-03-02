import React from 'react';

import { subscriptionTiersInOrder } from 'data/subscriptionTiers';

import PricingCard from './pricing-card';

const Pricing = (): React.JSX.Element => {
  return (
    <section id="pricing" className=" px-8 py-16 bg-accent/5">
      <h2 className="text-4xl text-center text-balance font-semibold mb-8">
        Plans That Suit Your Needs
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-screen-xl mx-auto">
        {subscriptionTiersInOrder.map((tier) => (
          <PricingCard key={tier.name} {...tier} />
        ))}
      </div>
    </section>
  );
};

export default Pricing;
