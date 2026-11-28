import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
const Header = ({
  Name,
  onClose,
}: {
  Name: string;
  onClose?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <header className="flex h-8.25 items-center bg-[#78d4a4] text-gray-800 relative">
      <h1 className="ml-2.5 text-[17x] font-semibold ">
         {Name}
     </h1>

     <button
       type="button"
       aria-label="Close"
       className="absolute right-3 hover:bg-red-100 p-0.5 rounded-full cursor-pointer"
       onClick={onClose ?? (() => navigate("/"))}
     >
       <IoMdClose size={20} />
     </button>
   </header>
  )
}

export default Header