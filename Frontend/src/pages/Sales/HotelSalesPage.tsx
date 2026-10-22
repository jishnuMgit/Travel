import HotelDetail from "../../components/sales/HotelSales/HotelDetail";

const TicketSalesPage = () => {
  return (
    <div className="flex min-h-screen w-full items-start justify-center bg-white px-2 py-2 sm:px-4 sm:py-4">
      <div className="min-h-fit w-full min-w-0 max-w-375 bg-white p-0">
        <HotelDetail />
      </div>
    </div>
  );
};

export default TicketSalesPage;