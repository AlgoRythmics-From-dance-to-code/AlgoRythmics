import CoursesSkeleton from '../../components/CoursesSkeleton';

/**
 * Custom loading state for the Courses page.
 * Overrides the global animation with a specific skeleton layout.
 */
export default function CoursesLoading() {
  return <CoursesSkeleton />;
}
