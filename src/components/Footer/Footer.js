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
import React, { Component } from "react";
import { Container } from "react-bootstrap";

class Footer extends Component {
  render() {
    return (
      <footer className="footer px-0 px-lg-3">
        <Container fluid>
          <nav>

            <p className="copyright text-center">
              © {new Date().getFullYear()}{" "}
              <a href="https://www.linkedin.com/in/ronan-rodrigues-3b05751a0/">Reboot Soluções</a>, feito com amor para um negócio de família
            </p>
          </nav>
        </Container>
      </footer>
    );
  }
}

export default Footer;
