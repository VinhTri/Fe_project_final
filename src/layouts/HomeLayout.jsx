import { Outlet } from "react-router-dom";
import HomeSidebar from "../components/home/Sidebar/HomeSidebar";
import HomeTopbar from "../components/home/Topbar/HomeTopbar";
import "../styles/home/HomeLayout.css";

export default function HomeLayout() {
  return (
    <div className="home-page">
      {/* Nền background */}
      <div className="home-page__bg" />

      {/* Overlay mờ nhẹ */}
      <div className="home-page__overlay" />

      {/* Khung chính: sidebar + nội dung */}
      <div className="home__wrap">
        <aside className="home__sidebar">
          <HomeSidebar />
        </aside>

        <main className="home__main">
          {/* Thanh topbar cố định phía trên nội dung */}
          <div className="home__topbar">
            <HomeTopbar />
          </div>

          {/* Khu vực nội dung các page con */}
          <div className="home__content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
