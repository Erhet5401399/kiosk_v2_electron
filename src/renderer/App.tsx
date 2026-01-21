import { useEffect, useState } from 'react'
import reactLogo from "./assets/react.svg"
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [result, setResult] = useState<string>("");

  const handlePrint = async () => {
    try {
      const result = await window.electron.print("First print");
      setResult(result);
      // alert(result);
    } catch (err) {
      console.error("Print failed", err);
    }
  };

  const tryAuthenticate = async () => {
    try {
      const result = await window.electron.authenticate();
      console.log(result);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    tryAuthenticate();
  }, []);

  return (
    <>
      <div>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>

        <button onClick={() => handlePrint()}>
          print
        </button>

        <p>{result}</p>
      </div>
    </>
  )
}

export default App
