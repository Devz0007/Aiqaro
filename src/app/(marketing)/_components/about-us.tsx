import React from 'react';

const AboutUs = (): React.JSX.Element => {
  return (
    <section id="about-us" className="py-16">
      <div className="container max-w-screen-xl mx-auto px-8">
        <h2 className="text-4xl text-center font-semibold mb-12">About Us</h2>
        <div className="text-center mb-8">
          <p className="text-lg">
            Welcome to <strong>AIqaro</strong>, where innovation meets clinical
            research. Our mission is to empower Contract Research Organizations
            (CROs) and clinical research professionals with AI-driven solutions
            to streamline processes, enhance data accuracy, and accelerate
            clinical trials.
          </p>
          <p className="text-lg">
            At <strong>AIqaro</strong>, we envision a future where artificial
            intelligence seamlessly integrates into every aspect of clinical
            research, driving collaborations that lead to groundbreaking
            discoveries.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold">Our Mission</h3>
            <p>
              Simplify and optimize clinical research workflows with
              intelligent, data-driven tools. We aim to reduce complexities and
              costs in clinical trials, accelerating research outcomes and
              advancing medical science worldwide.
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold">Our Vision</h3>
            <p>
              Lead the transformation of clinical research through AI, setting
              new standards for quality and reliability, and fostering
              collaborations that improve patient lives globally.
            </p>
          </div>
        </div>
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold mb-4">Meet Our Founder</h3>
          <div >
            <div className='text-center'>
              <h4 className="text-xl font-semibold">Devarshi Hazarika</h4>
              <p>Founder & CEO</p>
              <p>
                With 18+ years of experience in strategic and data-driven
                product management, Devarshi has led innovations at Fortune 50
                companies. His expertise ensures <strong>AIqaro</strong>{' '}
                delivers cutting-edge AI solutions tailored to clinical
                research.
              </p>
            </div>
           
          </div>
        </div>
        <div className="text-center mt-12">
          <h3 className="text-2xl font-bold">Why Choose AIqaro?</h3>
          <ul className="list-disc list-inside">
            <li>
              Innovative AI Solutions tailored to the needs of clinical
              research.
            </li>
            <li>
              Enhanced Efficiency through optimized workflows and reduced manual
              errors.
            </li>
            <li>
              Data-Driven Decisions with advanced analytics and visualization
              tools.
            </li>
            <li>
              Commitment to Excellence in quality, reliability, and research
              outcomes.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
