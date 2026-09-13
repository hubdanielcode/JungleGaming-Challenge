interface LoadingSkeletonProps {
  className?: string;
}

const LoadingSkeleton = ({ className = "" }: LoadingSkeletonProps) => {
  return (
    <div
      className={`skeleton-shimmer rounded-card ${className}`}
      aria-hidden="true"
    />
  );
};

export { LoadingSkeleton };
