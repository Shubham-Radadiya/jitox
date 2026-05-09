import { CommonModal, Button } from "../../components/ui/CommanUI";
import successImg from "../../assets/success.png";

const UserAddedSuccessModal = ({ open, onClose, userData, onAddAnother }) => {
  if (!userData) return null;

  return (
    <CommonModal
      open={open}
      onClose={onClose}
      width="min(480px, 92vw)"
      title=""
      bodyClassName="!px-3 !pt-2.5 !pb-3.5 sm:!px-5 sm:!pt-4 sm:!pb-5"
      footerClassName="hidden"
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-2.5 w-full max-w-[180px] sm:mb-4 sm:max-w-[240px]">
          <img src={successImg} alt="Success" className="h-20 w-full object-contain sm:h-24" />
        </div>

        <h2 className="mb-1.5 text-base font-bold tracking-tight text-dark sm:mb-2 sm:text-2xl dark:text-slate-100">
          Users Added Successfully
        </h2>

        <p className="mb-2.5 max-w-[38ch] text-[12px] leading-relaxed text-slate-600 sm:mb-3 sm:text-sm dark:text-slate-300">
          <span className="font-semibold text-dark dark:text-slate-100">{userData.name}</span> has been added as a new{" "}
          <span className="font-semibold text-dark dark:text-slate-100">{userData.role || "user"}</span> for{" "}
          <span className="font-semibold text-dark dark:text-slate-100">{userData.region || "All Regions"}</span> covering{" "}
          <span className="font-semibold text-dark dark:text-slate-100">{userData.assignedAreas || "All Areas"}</span>.
        </p>

        <p className="mb-4 text-[13px] font-semibold text-primary sm:mb-5 sm:text-sm">
          Login credentials have been emailed to the {userData.role || "User"}
        </p>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:gap-2.5">
          <Button
            label={`View ${userData.role || "User"} Profile`}
            variant="outline"
            size="sm"
            className="w-full border-primary/45 min-h-9! px-3! py-1.5! text-[13px]! leading-tight! font-semibold text-primary hover:bg-primary hover:text-white dark:hover:text-white sm:flex-1 sm:min-h-10! sm:px-3! sm:py-2! sm:text-[13px]!"
            onClick={onClose}
          />
          <Button
            label={`Add Another ${userData.role || "User"}`}
            variant="outline"
            size="sm"
            className="w-full border-slate-300 min-h-9! px-3! py-1.5! text-[13px]! leading-tight! font-semibold text-dark hover:bg-primary hover:text-white dark:border-slate-600 dark:text-slate-100 dark:hover:bg-primary dark:hover:text-white sm:flex-1 sm:min-h-10! sm:px-3! sm:py-2! sm:text-[13px]!"
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
