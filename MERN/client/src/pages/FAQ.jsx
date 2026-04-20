import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function FAQ() {
  const [expandedIndex, setExpandedIndex] = useState(null);

  const faqItems = [
    {
      header: 'What are Anonymous Accounts?',
      body: 'Anonymous accounts cannot utilize the private messaging system, and their names do not appear when they make posts on the forum.'
    },
    {
      header: 'What are the guidelines for messaging and reporting?',
      body: 'When using our messaging and forum features, please maintain respectful and professional communication. All messages and posts should be free of harassment, hate speech, spam, or discriminatory content. If you encounter inappropriate content, use the report function to flag it for moderator review. Reports should include a clear reason for the flag. Our moderation team reviews reported content and takes appropriate action to maintain a safe community environment. Misuse of the reporting system is taken seriously and may result in account restrictions.'
    },
    {
      header: 'How do I post class advice?',
      body: 'To post class advice, navigate to the course page for the class you want to discuss. Click on the "Post Comment" button and share your advice or experience. Your post can include tips on studying, course content explanations, time management strategies, or other helpful insights. You have the option to post anonymously if you prefer. Remember to keep your advice constructive, respectful, and relevant to the course. Other students can reply to your advice and engage in discussions, creating a collaborative learning environment.'
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
            <div key={index} className="accordion-item" style={{marginTop:'1rem'}}>
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
