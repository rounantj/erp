import React, { Component } from "react";
import { useLocation, Route, Switch } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";


import sidebarImage from "assets/img/sidebar-3.jpg";

function Guest() {

  const { user } = useContext(UserContext);
  useEffect(() => {
    console.log({ user })
  }, [user])

  const getRoutes = (routes) => {
    const routes = [
      {
        path: "/wellcome",
        name: "Bem vindo!",
        icon: "nc-icon nc-bullet-list-67",
        component: ProductAndServiceTable,
        layout: "/guest"
      },
    ]

    return routes.filter(a => a?.rule.includes(user?.user?.role)).map((prop, key) => {
      if (prop.layout === "/admin") {
        return (
          <Route
            path={prop.layout + prop.path}
            render={(props) => <prop.component {...props} />}
            key={key}
          />
        );
      } else {
        return null;
      }
    });
  };
  return (
    <>
      <div className="content">
        <Switch>{getRoutes(routes)}</Switch>
      </div>
    </>
  );
}

export default Guest;
