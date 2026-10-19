import TicketDetails from "../../components/sales/TicketSales/TicketDetails";

const TicketSalesPage = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white px-4 py-4">
      <div className="min-h-fit w-full max-w-[1500px] md:[1000px] bg-white p-0">
        <TicketDetails />
      </div>
    </div>
  );
};

export default TicketSalesPage;