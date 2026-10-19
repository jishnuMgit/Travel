
const Header = ({ Name }: { Name: string }) => {
  return (
    <header className="flex h-[33px] items-center bg-[#9fdfbc]">
            <h1 className="ml-4 text-[14px] font-semibold text-[#24364d]">
             {Name}
            </h1>
          </header>
  )
}

export default Header