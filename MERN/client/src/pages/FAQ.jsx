import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqItems = [
    {
      header: 'What are Anonymous Accounts?',
      body: 'Anonymous accounts cannot utilize the private messaging system, and their names do not appear when they make posts on the forum.'
    }
  ];

  const toggleAccordion = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <h1 className="faq-title">Frequently Asked Questions</h1>
        <p className="faq-subtitle">Find answers to common questions about our platform</p>
        
        <div className="mt-8">
          <Link to="/Dashboard">
            <button className="w-full blocky-button blocky-button-secondary" style={{ maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto', display: 'block' }}>
              ← BACK TO DASHBOARD
            </button>
          </Link>
        </div>

        <div className="accordion">
          {faqItems.map((item, index) => (
            <div key={index} className="accordion-item">
              <button
                className="accordion-header"
                onClick={() => toggleAccordion(index)}
                aria-expanded={expandedIndex === index}
              >
                <span className="accordion-title">{item.header}</span>
                <span className={`accordion-icon ${expandedIndex === index ? 'expanded' : ''}`}>
                  ▼
                </span>
              </button>
              {expandedIndex === index && (
                <div className="accordion-content">
                  <p>{item.body}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
