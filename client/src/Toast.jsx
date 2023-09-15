const Toast = ({ message, showToast }) => {
  return (
    <div className={`toast ${showToast ? "show" : ""}`}>
      <span>{message}</span>
    </div>
  );
};

export default Toast;
