import { useNavigate, useParams } from "react-router-dom";
import FlatInteriorTour from "./FlatInteriorTour";

const FlatInteriorPage = () => {
  const { flatNumber } = useParams<{ flatNumber: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate(-1); // go back to previous page
  };

  return (
    <FlatInteriorTour onClose={handleClose} flatNumber={flatNumber || "103"} />
  );
};

export default FlatInteriorPage;
