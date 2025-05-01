import Footer from "@/components/footer";
import Header from "@/components/header";
import { Outlet } from "react-router-dom";

export default function RootLayout() {
    return (
        <div className="flex flex-col min-w-[270px] p-4 space-y-4">
            <Header />
            <Outlet />
            <Footer />
        </div>
    )
}