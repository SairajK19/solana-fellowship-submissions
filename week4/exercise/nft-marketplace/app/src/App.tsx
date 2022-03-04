import "./App.css";

// components
import Wallet from "./Wallet/Wallet";
import Navbar from "./Navbar/Navbar";
import Store from "./Store/Store";

function App() {
  return (
    <Wallet>
      <div className="App">
        <Navbar />
        <Store />
      </div>
    </Wallet>
  );
}

export default App;
