import Icon from './Icon.jsx';

export default function Stars({ rating }) {
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={rating >= i - 0.25 ? 'on' : 'off'}>
          <Icon name="star" />
        </span>
      ))}
    </span>
  );
}
