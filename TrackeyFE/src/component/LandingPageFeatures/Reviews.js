import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { motion } from 'framer-motion';

const sectionVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, staggerChildren: 0.2 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, type: 'spring', stiffness: 100 } },
};

const formVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const buttonVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.1, transition: { type: 'spring', stiffness: 300 } },
};

const starVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.2, transition: { type: 'spring', stiffness: 300 } },
};

const messageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReviewVisible, setIsReviewVisible] = useState(false);

  const storeId = Number(localStorage.getItem('store_id'));
  const userId = localStorage.getItem('user_id');
  const isOwner = !userId;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!storeId || (!userId && !isOwner)) {
      setMessage('You must be logged in to submit a review.');
      return;
    }

    setLoading(true);
    setMessage(null);

    const reviewPayload = {
      comment,
      rating,
    };

    if (isOwner) {
      reviewPayload.store_id = storeId;
      reviewPayload.store_user_id = null;
    } else {
      reviewPayload.store_id = null;
      reviewPayload.store_user_id = Number(userId);
    }

    const { error } = await supabase.from('reviews').insert([reviewPayload]);

    setLoading(false);

    if (error) {
      console.error('Insert error:', error);
      setMessage('Failed to submit review.');
    } else {
      setMessage('Review submitted successfully!');
      setComment('');
      setRating(5);
      setIsReviewVisible(false);
    }
  };

  return (
    <motion.section
      className="py-20 md:py-24 px-6 bg-gradient-to-b from-indigo-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={sectionVariants}
      role="region"
      aria-labelledby="review-form-title"
    >
      {/* Wavy Top Border */}
      <svg className="absolute top-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0,0 C280,100 720,0 1440,100 L1440,0 Z"
          fill="url(#gradient)"
          className="dark:fill-gray-800"
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#e0e7ff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#c7d2fe', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
      </svg>

      {/* Wavy Bottom Border */}
      <svg className="absolute bottom-0 w-full" viewBox="0 0 1440 100" preserveAspectRatio="none">
        <path
          d="M0,100 C280,0 720,100 1440,0 L1440,100 Z"
          fill="url(#gradient)"
          className="dark:fill-gray-800"
        />
      </svg>

      <div className="container mx-auto max-w-2xl relative z-10">
        <motion.div
          className="bg-white/70 dark:bg-gray-800/80 backdrop-blur-md rounded-2xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 border-l-4 border-transparent hover:border-indigo-500 dark:hover:border-indigo-300"
          variants={cardVariants}
          whileHover={{ scale: 1.05, y: -10 }}
        >
          <motion.h2
            id="review-form-title"
            className="text-2xl md:text-3xl font-extrabold text-center text-indigo-900 dark:text-white mb-6 font-sans relative before:absolute before:bottom-[-8px] before:left-1/2 before:-translate-x-1/2 before:w-24 before:h-1 before:bg-gradient-to-r before:from-indigo-500 before:to-indigo-700"
            variants={sectionVariants}
          >
            Share Your Experience
          </motion.h2>
          <motion.button
            onClick={() => setIsReviewVisible(!isReviewVisible)}
            className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-indigo-500/30 transition-all duration-300"
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            aria-label="Toggle Review Form"
          >
            {isReviewVisible ? 'Hide Review Form' : 'Leave a Review'}
          </motion.button>

          {isReviewVisible && (
            <motion.div variants={formVariants} initial="hidden" animate="visible" className="mt-6">
              {message && (
                <motion.div
                  className={`mb-6 text-base text-center font-medium rounded-md p-3 ${
                    message.includes('successfully')
                      ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400'
                  }`}
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {message}
                </motion.div>
              )}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating:
                  </label>
                  <div className="flex space-x-2 justify-center">
                    {[...Array(5)].map((_, i) => {
                      const starValue = i + 1;
                      return (
                        <motion.button
                          type="button"
                          key={starValue}
                          onClick={() => setRating(starValue)}
                          onMouseEnter={() => setHover(starValue)}
                          onMouseLeave={() => setHover(null)}
                          className="focus:outline-none"
                          variants={starVariants}
                          initial="rest"
                          whileHover="hover"
                          aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
                        >
                          <FaStar
                            className={`${
                              (hover || rating) >= starValue ? 'text-yellow-400' : 'text-gray-300'
                            } hover:shadow-yellow-400/30 transition-colors duration-200`}
                            size={28}
                          />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Your Review:
                  </label>
                  <textarea
                    id="comment"
                    name="comment"
                    rows="4"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                    className="mt-2 block w-full rounded-xl border-gray-300 dark:border-gray-600 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-base dark:bg-gray-800 dark:text-white transition-all duration-200"
                    aria-describedby="comment-description"
                  ></textarea>
                  <p id="comment-description" className="sr-only">
                    Share your experience with Sellytics in this review.
                  </p>
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  className={`w-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl hover:shadow-indigo-500/30 transition-all duration-300 ${
                    loading ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                  variants={buttonVariants}
                  initial="rest"
                  whileHover="hover"
                  aria-label="Submit Review"
                  aria-disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Review'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}