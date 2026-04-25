import { CommonModal, Button } from "../../components/ui/CommanUI";
import successImg from "../../assets/success.png";

const UserAddedSuccessModal = ({ open, onClose, userData, onAddAnother }) => {
  if (!userData) return null;

  return (
    <CommonModal open={open} onClose={onClose} width="450px" title="">
      <div className="flex flex-col items-center text-center p-4">
        {/* Success Illustration */}
        <div className="mb-6 w-full max-w-[280px]">
          <img src={successImg} alt="Success" className="w-full h-26 object-contain" />
        </div>

        <h2 className="text-xl font-bold text-dark mb-4">Users Added Successfully</h2>
        
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          <span className="font-semibold text-dark">{userData.name}</span> has been added as a new <span className="text-dark font-medium">{userData.role || "user"}</span> for <span className="text-dark font-medium">{userData.region || "All Regions"}</span> covering <span className="text-dark font-medium">{userData.assignedAreas || "All Areas"}</span>.
        </p>

        <p className="text-sm font-medium text-primary mb-8">
          Login credentials have been emailed to the {userData.role || "User"}
        </p>

        <div className="flex gap-4 w-full">
          <Button
            label={`View ${userData.role || "User"} Profile`}
            variant="outline"
            className="flex-1 text-primary border-primary hover:bg-primary/5 px-0 text-sm whitespace-nowrap"
            onClick={onClose}
          />
          <Button
            label={`Add Another ${userData.role || "User"}`}
            variant="outline"
            className="flex-1 text-dark border-gray-200 hover:bg-gray-50 px-0 text-sm whitespace-nowrap"
            onClick={() => {
              onClose();
              onAddAnother();
            }}
          />
        </div>
      </div>
    </CommonModal>
  );
};

export default UserAddedSuccessModal;
