import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaCheck, FaTimes } from 'react-icons/fa';

const ReviewsComponent = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reviews on component mount
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select(
        'review_id, reviewer_name, reviewer_email, rating, review_text, is_approved, created_at'
      )
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Error fetching reviews:', error);
      setError(error.message);
    } else {
      setReviews(data);
    }
    setLoading(false);
  };

  const handleApproval = async (reviewId, newStatus) => {
    if (!reviewId) {
      console.error("Invalid review id:", reviewId);
      alert("Unable to update review: Invalid review ID.");
      return;
    }

    const { error } = await supabase
      .from('reviews')
      .update({ is_approved: newStatus })
      .eq('review_id', reviewId);

    if (error) {
      console.error('Error updating review:', error);
      alert('Error updating review: ' + error.message);
    } else {
      // Update the review's approval status locally
      setReviews(
        reviews.map((review) =>
          review.review_id === reviewId
            ? { ...review, is_approved: newStatus }
            : review
        )
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
     
      </h2>
      {loading ? (
        <p className="text-gray-800 dark:text-white">Loading reviews...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="overflow-x-auto">
        <table className="min-w-full border border-yellow-800 dark:border-yellow-700">
          <thead className="bg-yellow-800 dark:bg-yellow-800">
            <tr>
              <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white dark:text-gray-200">
                Reviewer Name
              </th>
              <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white dark:text-gray-200">
                Reviewer Email
              </th>
              <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white dark:text-gray-200">
                Rating
              </th>
              <th className="py-2 px-4 border-r border-gray-300 dark:border-gray-700 text-left text-white dark:text-gray-200">
                Review
              </th>
              <th className="py-2 px-4 text-left text-white dark:text-gray-200">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr
                key={review.review_id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {review.reviewer_name}
                </td>
                <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {review.reviewer_email}
                </td>
                <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {review.rating}
                </td>
                <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">
                  {review.review_text}
                </td>
                <td className="py-2 px-4 border-t border-gray-300 dark:border-gray-700">
                  {review.is_approved ? (
                    <button
                      onClick={() =>
                        handleApproval(review.review_id, false)
                      }
                      title="Reject Review"
                      className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
                    >
                      <FaTimes />
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        handleApproval(review.review_id, true)
                      }
                      title="Approve Review"
                      className="p-2 rounded bg-green-500 text-white hover:bg-green-600"
                    >
                      <FaCheck />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {reviews.length === 0 && (
              <tr>
                <td
                  colSpan="5"
                  className="py-4 text-center text-gray-800 dark:text-white"
                >
                  No reviews found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

export default ReviewsComponent;
