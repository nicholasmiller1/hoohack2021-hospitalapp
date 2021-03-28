import './App.css';
import {useEffect, useState, useRef, memo} from 'react';
import {DataGrid, isOverflown, GridToolbar} from '@material-ui/data-grid';
import {Paper, Popper, Typography, TextField, Button, Select, MenuItem} from '@material-ui/core';
import {makeStyles} from '@material-ui/core/styles';
import firebase from './firebase.js';



function App() {
  const [data, setData] = useState();
  const [fileColumns, setFileColumns] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [fileSelects, setFileSelects] = useState([]);
  const [hospitalNameInput, setHospitalNameInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [errorText, setErrorText] = useState("");
  const database = firebase.database()

  useEffect(() => {
    database.ref().child("Prices").get().then(function(snapshot) {
      if (snapshot.exists()) {
        setData(snapshot.val().rows);
        console.log(snapshot.val());
      } else {
        console.log("No data available");
      }
    }).catch(function(error) {
      console.log(error);
    })
  }, [database]);

  const handleUpload = (event) => {
    const file = event.target.files[0];
    file.text().then(text => {
      const lines = text.split("\n");
      const headers = lines[0].split(",");
      console.log(file.name);
      if (headers.length < 3) {//checks if has three columns
        setErrorText("Error: First line must have at least 3 columns");
        console.log("error");
        return;
      }
      if (lines.length>=1500){//checks if file is too large
        setErrorText("Error: Please upload a file with less than 1500 rows")
        console.log("error");
        return;
      }
      if (file.name.substring(file.name.length-3) !== "csv"){//checks if csv file
        setErrorText("Error: File must be of type .csv");
        console.log("error");
        return;
      }

      setFileColumns(headers);
      setFileData(lines.slice(1, lines.length));
    });
  }

  const handleSelectChange = (key, event) => {
    const arr = fileSelects;
    console.log(arr + " | " + event + " | " + key);
    while (key >= arr.length) {
      arr.push("");
    }
    console.log(arr)
    arr[key] = event.target.value;
    setFileSelects(arr);
  }

  const handleSubmit = () => {
    const mappings = {
      Item: -1,
      Description: -1,
      Insurer: -1,
      Price: -1
    }
    fileSelects.forEach((select, key) => {
      if (select !== "" && select !== "None") {
        mappings[select] = key;
      }
    })
    console.log(mappings)

    const result = []

    fileData.forEach((row) => {
      const values = row.split(",");
      const obj = {
        name: hospitalNameInput,
        city: cityInput,
        short_description: mappings.Item !== -1 ? values[mappings.Item] : "null",
        long_description: mappings.Description !== -1 ? values[mappings.Description] : "null",
        payer: mappings.Insurer !== -1 ? values[mappings.Insurer] : "CASH",
        price: mappings.Price !== -1 ? values[mappings.Price] : "0",
      };
      result.push(obj);
    });

    result.forEach((object) => {
      database.ref().child("Prices").child("rows").push(object);
    });
    console.log(result);
  }
  
  return (
    
    <div className="App">
      <div style={{height: "70px", background: "#f7f7f7", borderBottom: "1px solid black"}}><h1 style={{bottom: "0px", margin: "0", paddingTop: "10px"}}>Hospital Price Comparator</h1></div>
      {data !== undefined && <DataTable json={data} />}

      <br/>
      <p style={{color: "red"}}>{errorText}</p>
      <p>Can't find the hospital you're looking for here? Try uploading the csv file found on their website! :DD</p>
      <div style={{display: "flex", width: "70%", margin: "0 auto", justifyContent: "space-around"}}>
        <input type="file" onChange={handleUpload} />
        {fileColumns.length !== 0 && <TextField variant="outlined" label="Hospital Name" value={hospitalNameInput} onChange={(event) => setHospitalNameInput(event.target.value)}></TextField>}
        {fileColumns.length !== 0 && <TextField variant="outlined" label="City, State" value={cityInput} onChange={(event) => setCityInput(event.target.value)}></TextField>}
      </div>
      {fileColumns.length !== 0 && <p>Please enter a hospital name and location. Then use the dropdowns to associate each heading with the word that closest matches.</p>} 
      {fileColumns.length !== 0 && <p>(associate each column from the table above with one and only one of the words below)</p>}
 
      <table style={{width: "80%", margin: "0 auto"}}>
        <tr>
          {fileColumns.map((column) => <td style={{padding: "10px"}}>{column}</td>)}
        </tr>
        <tr>
          {fileColumns.map((column, key) =>
            <td>
              <Select style={{ width: "80%" }} value={fileSelects[key]} onChange={(event) => handleSelectChange(key, event)}>
                <MenuItem value="None">None</MenuItem>
                <MenuItem value="Item">Item</MenuItem>
                <MenuItem value="Description">Description</MenuItem>
                <MenuItem value="Insurer">Insurer</MenuItem>
                <MenuItem value="Price">Price</MenuItem>
              </Select>
            </td>)
          }
        </tr>
      </table>

      {fileColumns.length !== 0 && <Button variant="contained" onClick={handleSubmit} style={{marginBottom: "25px", marginTop: "20px"}}>Submit</Button>}
      <br/>
      <br/>
      <br/>
      <br/>
    </div>
  );
}

export default App;

const DataTable = ({json}) => {
  console.log(json);
  // const rows = json.map((row, key) => ({
  //   id: key + 1,
  //   name: row.name,
  //   city: `${row.city}, ${row.state}`,
  //   item: row.short_description === "null" ? "None" : row.short_description,
  //   description: row.long_description === "null" ? "None" : row.long_description,
  //   payer: row.payer === "CASH" ? "None" : row.payer,
  //   price: `${row.price}`
  // }));

  const rows = [];
  let idIncrementer = 0;
  for (const row in json) {
    rows.push({
      id: idIncrementer,
      name: json[row].name,
      city: json[row].city + (json[row].state !== undefined ? ", " + json[row].state : ""),
      item: json[row].short_description === "null" ? "None" : json[row].short_description,
      description: json[row].long_description === "null" ? "None" : json[row].long_description,
      payer: json[row].payer === "CASH" ? "None" : json[row].payer,
      price: `${json[row].price}`
    });
    idIncrementer++;
  }

  const columns = [
    { field: "name", headerName: "Hospital", flex: 1, renderCell: renderCellExpand},
    { field: "city", headerName: "City", flex: 1, renderCell: renderCellExpand},
    { field: "item", headerName: "Item", flex: 1, renderCell: renderCellExpand},
    { field: "description", headerName: "Description", flex: 1, renderCell: renderCellExpand},
    { field: "payer", headerName: "Insurer", flex: 1, renderCell: renderCellExpand},
    { field: "price", headerName: "Price", type: "number", flex: 0.5, valueFormatter: (params) => `$${params.value}`, renderCell: renderCellExpand}
  ];

  return (
    <div className="data-display">
      <DataGrid rows={rows} columns={columns} pageSize={10} rowsPerPageOptions={[10, 20, 50]} pagination
        components={{
          Toolbar: GridToolbar
        }}
      />
    </div>
  );
}

const useStyles = makeStyles(() => ({
  root: {
    alignItems: 'center',
    lineHeight: '24px',
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    '& .cellValue': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
  },
}));

const CellExpand = memo(function CellExpand(props) {
  const { width, value } = props;
  const wrapper = useRef(null);
  const cellDiv = useRef(null);
  const cellValue = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();
  const [showFullCell, setShowFullCell] = useState(false);
  const [showPopper, setShowPopper] = useState(false);

  const handleMouseEnter = () => {
    const isCurrentlyOverflown = isOverflown(cellValue.current);
    setShowPopper(isCurrentlyOverflown);
    setAnchorEl(cellDiv.current);
    setShowFullCell(true);
  };

  const handleMouseLeave = () => {
    setShowFullCell(false);
  };

  useEffect(() => {
    if (!showFullCell) {
      return undefined;
    }

    function handleKeyDown(nativeEvent) {
      // IE11, Edge (prior to using Bink?) use 'Esc'
      if (nativeEvent.key === 'Escape' || nativeEvent.key === 'Esc') {
        setShowFullCell(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [setShowFullCell, showFullCell]);

  return (
    <div
      ref={wrapper}
      className={classes.root}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={cellDiv}
        style={{
          height: 1,
          width,
          display: 'block',
          position: 'absolute',
          top: 0,
        }}
      />
      <div ref={cellValue} className="cellValue">
        {value}
      </div>
      {showPopper && (
        <Popper
          open={showFullCell && anchorEl !== null}
          anchorEl={anchorEl}
          style={{ width, marginLeft: -17 }}
        >
          <Paper
            elevation={1}
            style={{ minHeight: wrapper.current.offsetHeight - 3 }}
          >
            <Typography variant="body2" style={{ padding: 8 }}>
              {value}
            </Typography>
          </Paper>
        </Popper>
      )}
    </div>
  );
});

const renderCellExpand = (params) => {
  return (
    <CellExpand 
      value={params.value ? params.value.toString() : ''}
      width={params.colDef.width}
    />
    
  );
}