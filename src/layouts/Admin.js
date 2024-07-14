/*!

=========================================================
* Light Bootstrap Dashboard React - v2.0.1
=========================================================

* Product Page: https://www.creative-tim.com/product/light-bootstrap-dashboard-react
* Copyright 2022 Reboot Soluções (https://www.creative-tim.com)
* Licensed under MIT (https://github.com/creativetimofficial/light-bootstrap-dashboard-react/blob/master/LICENSE.md)

* Coded by Reboot Soluções

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
import React, { Component, useContext, useEffect, useState } from "react";
import { useLocation, Route, Switch } from "react-router-dom";

import AdminNavbar from "components/Navbars/AdminNavbar";
import Footer from "components/Footer/Footer";
import Sidebar from "components/Sidebar/Sidebar";
import FixedPlugin from "components/FixedPlugin/FixedPlugin.js";

import routes from "routes.js";

import sidebarImage from "assets/img/sidebar-3.jpg";
import { UserContext } from "context/UserContext";

function Admin() {
  const [image, setImage] = React.useState(sidebarImage);
  const [color, setColor] = React.useState("black");
  const [hasImage, setHasImage] = React.useState(true);
  const location = useLocation();
  const mainPanel = React.useRef(null);
  const { user } = useContext(UserContext);
  const [trustRoutes, setTrustRoutes] = useState([])
  useEffect(() => {
    console.log({ user })
    if (user) {
      const role = user?.user?.role
      console.log({ routes, role })
      let newRoutes = routes.filter(a => a?.rule.includes(role) || a?.rule.includes(undefined) || a?.rule.includes(null))
      console.log({ newRoutes })
      setTrustRoutes(newRoutes)
    }
  }, [user])

  const getRoutes = (routes) => {
    return routes.map((prop, key) => {
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

  React.useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
    mainPanel.current.scrollTop = 0;
    if (
      window.innerWidth < 993 &&
      document.documentElement.className.indexOf("nav-open") !== -1
    ) {
      document.documentElement.classList.toggle("nav-open");
      var element = document.getElementById("bodyClick");
      element.parentNode.removeChild(element);
    }

  }, [location]);


  return (
    <>
      {
        user &&
        <>
          <div className="wrapper">
            <Sidebar color={color} image={hasImage ? image : ""} routes={trustRoutes} />
            <div className="main-panel" ref={mainPanel}>
              <AdminNavbar />
              <div className="content">
                <Switch>{getRoutes(trustRoutes)}</Switch>
              </div>
              <Footer />
            </div>
          </div>
          <FixedPlugin
            hasImage={hasImage}
            setHasImage={() => setHasImage(!hasImage)}
            color={color}
            setColor={(color) => setColor(color)}
            image={image}
            setImage={(image) => setImage(image)}
          />
        </>
      }
      {
        !user &&
        <>
          <div ref={mainPanel}>
            <div >
              <Switch>{getRoutes(routes)}</Switch>
            </div>

          </div>
        </>
      }


    </>
  );
}

export default Admin;
