import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-10 text-gray-700 bg-gray-100">{children}</main>
    </div>
  );
};

export default Layout;
