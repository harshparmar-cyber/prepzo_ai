import "./DeleteModal.css";

function DeleteModal({
  isOpen,
  onClose,
  onDelete,
  fileName,
}) {
  if (!isOpen) return null;

  return (
    <div className="delete-overlay">

      <div className="delete-modal">

        <div className="delete-icon">
          🗑️
        </div>

        <h2>Delete File?</h2>

        <p>
          Are you sure you want to delete
        </p>

        <h3>{fileName}</h3>

        <span>
          This action cannot be undone.
        </span>

        <div className="delete-buttons">

          <button
            className="cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            className="confirm-delete-btn"
            onClick={onDelete}
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}

export default DeleteModal;