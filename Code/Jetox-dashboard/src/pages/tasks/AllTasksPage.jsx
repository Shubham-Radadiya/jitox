import { Navigate } from "react-router-dom";
import TaskBoard from "../../components/tasks/TaskBoard";
import { isAdminUser, getStoredUser } from "../../utils/authSession";

export default function AllTasksPage() {
  const user = getStoredUser();
  if (!isAdminUser(user)) {
    return <Navigate to="/dashboard/tasks/my" replace />;
  }
  return <TaskBoard restrictToSelf={false} showMonitoring />;
}
