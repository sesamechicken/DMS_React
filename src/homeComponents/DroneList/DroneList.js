import React from 'react';
import DroneListItem from './DroneListItem/DroneListItem';
import CustomScrollbars from '../../util/CustomScrollbars';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import { useSelector } from 'react-redux';
import Spinner from '../UI/Spinner/Spinner';


const useStyles = makeStyles((theme) => ({
    header: {
        fontSize: '20px',
        color: 'white',
        margin: 'auto',
        padding: '10px'
    },
    buttonLayout: {
        display: 'flex',
        flexDirection: 'row',
        margin: '20px 20px 15px',
        padding: '0px 30px'
    },
    button: {
        alignSelf: 'flex-end',
        marginLeft: 'auto'
    }

}));
const DroneList = (props) => {
    const classes = useStyles();
    const [value, setValue] = React.useState('1');
    
    const handleChange = (event) => {
        setValue(event.target.value);
    };
    return (
        // <div className="module-list mail-list">
        <div data-test="container-component">
            {props.drones ?
            <FormControl component="fieldset">
                <p className={classes.header}>Select Mission</p>
                <CustomScrollbars className="module-list-scroll scrollbar"
                    style={{ height: 200 >= 800 ? 'calc(100vh - 600px)' : 'calc(100vh - 400px)', minWidth: '300px' }}>
                    <RadioGroup aria-label="gender" name="gender1" value={value} onChange={handleChange}  data-test="radio-component">
                        {props.drones.map((drone, index) =>
                            // <FormControlLabel control={}>
                            <DroneListItem key={index} drone={drone} data-test="dronelist-component"/>
                        )}
                    </RadioGroup>
                </CustomScrollbars>
                <div className={classes.buttonLayout}>
                    <Button variant="outlined" color='white' onClick={props.abort} data-test="button1-component">Abort</Button>
                    <Button variant="outlined" color="white" className={classes.button} onClick={() => props.select(value)} data-test="button2-component">Select</Button>
                </div>
            </FormControl>: <div>Spinner</div>}
        </div>

    )
};

export default DroneList;