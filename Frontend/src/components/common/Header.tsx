import { IoMdClose } from "react-icons/io";
import { useNavigate } from "react-router-dom";
const Header = ({ Name }: { Name: string }) => {
  const Navigate=useNavigate()
  return (
    <header className="flex h-8.25 items-center bg-[#9fdfbc] text-gray-800 relative">
      <h1 className="ml-4 text-[17x] font-semibold ">
         {Name}
     </h1>

     <button className="absolute right-3  hover:bg-red-100 p-0.5 rounded-full cursor-pointer" onClick={()=>{Navigate('/')}}><IoMdClose size={20}/></button>
   </header>
  )
}

export default Header