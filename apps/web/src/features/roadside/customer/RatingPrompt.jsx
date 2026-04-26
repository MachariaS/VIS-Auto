import { useState } from 'react';
import { request } from '../../../shared/helpers';

export default function RatingPrompt({ completedRequest, token, onDone }) {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!score) return;
    setSubmitting(true);
    try {
      await request(
        `/ratings/${completedRequest.id}`,
        { score, comment: comment.trim() || undefined },
        'POST',
        token,
      );
      setSubmitted(true);
      setTimeout(onDone, 1800);
    } catch (e) {
      setError(e.message || 'Unable to submit rating.');
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rating-prompt">
        <div className="rating-thanks">
          <span className="rating-thanks-icon">⭐</span>
          <h3>Thank you!</h3>
          <p>Your review helps other customers find the best providers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rating-prompt">
      <div className="rating-prompt-head">
        <p className="eyebrow">Job complete</p>
        <h3>How was your experience?</h3>
        <p className="rating-prompt-sub">
          {completedRequest.issueType} · {completedRequest.providerName}
        </p>
      </div>

      <div className="rating-stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`rating-star ${star <= (hovered || score) ? 'rating-star--lit' : ''}`}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setScore(star)}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
      </div>

      {score > 0 && (
        <p className="rating-label">
          {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][score]}
        </p>
      )}

      <label>
        <span>Comment (optional)</span>
        <textarea
          rows={3}
          placeholder="Tell us what went well or what could improve…"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </label>

      {error && <div className="status-banner">{error}</div>}

      <div className="rating-actions">
        <button
          className="primary-cta"
          type="button"
          disabled={!score || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting…' : 'Submit review'}
        </button>
        <button className="ghost-button" type="button" onClick={onDone}>
          Skip
        </button>
      </div>
    </div>
  );
}
