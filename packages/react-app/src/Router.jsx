import { BrowserRouter, Route, Switch, NavLink } from "react-router-dom";
import LandingPage from "./LandingPage";
import "antd/dist/antd.css";

const Router = () => {
  return (
    <>
      <BrowserRouter>
        <Switch>
          <Route exact path="/">
            <LandingPage />
          </Route>
          <Route path="/callback" element={<NavLink replace to="/" />} />
        </Switch>
      </BrowserRouter>
    </>
  );
};

export default Router;
