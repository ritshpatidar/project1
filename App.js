import React, { useEffect } from "react";
import { Text, View, PermissionsAndroid} from "react-native";
import RNBootSplash from "react-native-bootsplash";
import Login from './js_files/Login';
import Profile from './js_files/Profile';
import Home from './js_files/Home';
import AsyncStorage from '@react-native-community/async-storage';
import Geolocation from 'react-native-geolocation-service';
import { log } from "react-native-reanimated";

export default class App extends React.Component {
  
  constructor(props){
    super(props);
    this.state = {
      showRealApp: false,
      number: '',
      logged_in: null,
      is_profile_updated: null,
      location: '0,0',
      lastPosition: null,
      slides: [{
        key: 's1',
        image: {
            uri: 'https://raw.githubusercontent.com/AboutReact/sampleresource/master/intro_discount.png',
        }
      }]
    }
    
    this.LOGGED_IN_KEY = "LOGGED_IN";
    this.PROFILE_UPDATED_KEY = "PROFILE_UPDATED";
  }

  componentDidMount(){
    this.init().finally(() => {
      RNBootSplash.hide({ duration: 250 });
    });
  }

  async loc(){
    /*LOCATION : */
    //Grant the permission for Location
    console.log("Loc called");
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
          'title': 'ReactNativeCode Location Permission',
          'message': 'ReactNativeCode App needs access to your location '
      })

    console.log(granted);

    if(granted) {
      Geolocation.getCurrentPosition(
          (position) => {
              console.log("My current location", JSON.stringify(position));
              this.setState({
                  location: position.coords.latitude.toString() + "," + position.coords.longitude.toString()
              })
          },
          (error) => {
              // See error code charts below.
              console.log(error.code, error.message);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
          
      //this.watchID = navigator.geolocation.watchPosition((lastPosition) => {
      //this.setState({lastPosition});
      //});
  }
  //----LOCATION END----//
  }

  init = async () => {
    const axios = require('axios');
    //request
    try{
      let res = await axios({
        url: "https://abstore.co.in/adminpanel/api/auth/getSplashScreenBanners",
        method: "POST"
      });

      let _slides = [];
      for(let i=0; i<res.data.length; i++)
        _slides.push({key:"s"+(i+1).toString(), image: {uri: res.data[i].photo_path}});
      
      this.setState({slides: _slides});
    } catch(error){
      console.log("Error in getting pngs of splash");
      console.log(error);
    }

    try {
      const logged_in = await AsyncStorage.getItem(this.LOGGED_IN_KEY);
      const profile_updated = await AsyncStorage.getItem(this.PROFILE_UPDATED_KEY);
      let l = null, p = null;

      console.log(profile_updated+","+logged_in);

			if(logged_in !== null){
        if(logged_in == "true"){
          l = true;
        } else {
          l = false;
        }
			} else {
				l = false;
      }
      
      if(profile_updated !== null){
        if(profile_updated == "true"){
          p = true;
        } else {
          p = false;
        }
			} else {
				p = false;
      }
      
      console.log(p+","+l);
      this.loc();
      this.setState({logged_in: l, is_profile_updated: p});
		} catch (error) {
      console.log("Error in async storage read: "+error);
      this.setState({logged_in: false, is_profile_updated: false});
    }
    
  }

  updateLoginProfileState = (_login, _profile) =>{
    console.log("update calleddddddddd");
    console.log(_login+","+_profile);
    this.setState({logged_in: _login, is_profile_updated: _profile});
  }

  render(){
    if(this.state.logged_in && this.state.is_profile_updated){
      return (
        <Home updateLoginProfileState={this.updateLoginProfileState}/>
      );
    } else if(this.state.logged_in && !this.state.is_profile_updated){
      return (
        <Profile updateLoginProfileState={this.updateLoginProfileState}/>
      );
    } else {
      return (
        <Login slides={this.state.slides} updateLoginProfileState={this.updateLoginProfileState} location={this.state.location}/>
      );
    }

  }
}

/*
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output App/src/main/assets/index.android.bundle --assets-dest App/src/main/res/
./gradlew assembleRelease -x bundleReleaseJsAndAssets
*/

/*function App() {
  let init = async () => {
    // …do multiple async tasks
  };

  useEffect(() => {
    init().finally(() => {
      RNBootSplash.hide({ duration: 250 });
    });
  }, []);

  return <Text>My awesome app</Text>;
}*/

//export default App;

/*_renderItem = ({ item }) => {
    //{item.text} {item.title}
    //console.log(item.key);
    let bgcolor = ["white","",""];
    if(item.key[1] == "1")
      bgcolor[0] = "white", bgcolor[1]="", bgcolor[2]="";
    else if(item.key[1] == "2")
      bgcolor[0] = "", bgcolor[1]="white", bgcolor[2]="";
    else
      bgcolor[0] = "", bgcolor[1]="", bgcolor[2]="white";

    return (
      <View style={styles.slide}>
          <Image style={{width:256, height:256, position: 'absolute', top:this.deviceSize.height*0.05}} source={item.image} />
          <View style={{justifyContent:'space-between',position:'absolute', bottom: this.deviceSize.height*0.52, alignItems:'center'}}>
            <Text style={{color:'white', fontSize: 25}}>{item.title}</Text>
            <Text style={{color:'white', width: '70%', textAlign:'center'}}>{item.text}</Text>
          </View>
          <View style={{position:'absolute', bottom: this.deviceSize.height*0.45, flexDirection:'row', width: '10%', justifyContent:'space-between'}}>
            <View style={{width: 8, height: 8, borderRadius: 4, borderColor: "white", borderWidth:1, backgroundColor:bgcolor[0]}}></View>
            <View style={{width: 8, height: 8, borderRadius: 4, borderColor: "white", borderWidth:1, backgroundColor:bgcolor[1]}}></View>
            <View style={{width: 8, height: 8, borderRadius: 4, borderColor: "white", borderWidth:1, backgroundColor:bgcolor[2]}}></View>
          </View>
      </View>
    );
  }

  _onDone = () => {
    // User finished the introduction. Show real app through
    // navigation or simply by controlling state
    this.setState({ showRealApp: true });
  }

  render() {
    if (this.state.showRealApp) {
      return <Text>Hello</Text>;
    } else {
      return (
        <>
        <AppIntroSlider renderItem={this._renderItem} data={slides} onDone={this._onDone}/>
        <Card style={{flex:1, flexDirection:'column' ,margin:0 ,elevation:10 ,position:'absolute', width: '90%', height:'40%', backgroundColor:'white', borderRadius: 5, bottom: 0, alignItems: 'center', left: this.deviceSize.width*0.05}}>
          <Text style={{fontSize:20, marginTop: 10}}>Enter Number</Text>
          <Text style={{color:'gray', marginTop:10}}>Previous logged in no. 7234546976</Text>
          <TextInput
            placeholder="Mobile Number (10 Digit)"
            autoCapitalize="none"
            editable={true}
            keyboardType="numeric"
            style={styles.textInput}
            onChangeText={number => this.setState({ number })}
            value={this.state.number}
          />
          <Text style={{color:'gray', fontSize: 15, width: "80%", textAlign:"center", marginTop:15}}>
            {"By tapping continue, I agree to the "} 
            <Text style={{color:"black", textDecorationLine:'underline'}}>
              {"Terms of Use"}
            </Text>
          </Text>
          <Button style={{elevation:10, alignSelf: "center", backgroundColor:'#8bc34a', marginTop: "8%"}} rounded onPress={()=>{}}>
        	  <Text style={{color:"white", paddingLeft:"10%", paddingRight:'10%' ,fontSize:16}}>Continue</Text>
          </Button>
          <Button style={{alignSelf:'center', marginTop: "4%"}} transparent light androidRippleColor="#00c853"
            onPress={()=>{console.log("Explore clicked");}}
          >
            <Text style={{fontWeight: "bold"}}>EXPLORE NOW</Text>
          </Button>
        </Card>
        </>
      );
    }
  }*/