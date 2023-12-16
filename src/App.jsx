import {useState} from 'react';
import './index.css';
import axios from 'axios';

function App() {
  const [value, setValue] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    const url = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
    try {
      const res = await axios.get(`${url}${value}`);
      // console.log(res.data[0]);
      setData(res.data);
      setErr(null);
    } catch (error) {
      // console.log(error);
      setData(null);
      setErr(1);
    }
  };
  function play() {
    try {
      let audio = new Audio(data[0].phonetics[0].audio);
      audio.play();
    } catch (e) {
      console.log(e);
    }
  }
  return (
    <>
      <div className="container">
        <form className="search-box" onSubmit={handle}>
          <input
            type="text"
            placeholder="Type the word here.."
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <div className="result" id="result">
          {data ? (
            <>
              <div className="word">
                <h3>{data[0].word}</h3>
                <button onClick={play}>
                  <i className="fas fa-volume-up"></i>
                </button>
              </div>
              <div className="details">
                <p>{data[0].meanings[0].partOfSpeech}</p>
                <p>/{data[0].phonetic}/</p>
              </div>
              <p className="word-meaning">
                {data[0].meanings[0].definitions[0].definition}
              </p>
              <p className="word-example">
                {data[0].meanings[0].definitions[0].example || ''}
              </p>
            </>
          ) : null}
          {err ? <p>Enter a valid english word</p> : null}
        </div>
      </div>
    </>
  );
}

export default App;
