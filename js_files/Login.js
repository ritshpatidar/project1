import React, { useEffect } from "react";
import { Text, StyleSheet, Image, View, TextInput, Dimensions, Alert, StatusBar, Modal, PermissionsAndroid} from "react-native";
import {Card, Button} from 'native-base';
import AppIntroSlider from 'react-native-app-intro-slider';
//import { not } from "react-native-reanimated";
import SmsListener from 'react-native-android-sms-listener';
import AsyncStorage from '@react-native-community/async-storage';

class Timer extends React.Component {
  
  constructor(props){
    super(props);
    this.initial = 181;
    this.state = {
      timer: null,
      counter: this.initial
    };
  }

  componentDidMount() {
    this.start();
    //let timer = setInterval(this.tick, 1000);
    //this.setState({timer});
  }

  componentWillUnmount() {
      this.stop();
  }

  start(){
    let timer = setInterval(this.tick, 1000);
    this.setState({timer:timer, counter: this.initial});
  }

  stop(){
    clearInterval(this.state.timer);
    this.setState({counter: 0});
  }

  tick =() => {
    if(this.state.counter == 1){
      this.props.enableResend();
      this.stop();
    } else {
      this.setState({
        counter: this.state.counter - 1
      });
    }
  }

  render() {
    return (
      <Text>{this.state.counter}</Text>
    );
  }
}

class VerifyOTP extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      inp0: '', inp1:'', inp2:'', inp3:'', inp4: '', inp5:'',
      resendEnabled: false
    }
    this.inpRefs = [null, null, null, null, null, null];
    this.timerRef = null;
    this.subscription = null;
    this.userid = null;
    this.username = null;
    this.token_data = null;
    this.is_profile_updated = false;
    this.logged_in = false;
    this.LOGGED_IN_KEY = "LOGGED_IN";
    this.TOKEN_KEY = "TOKEN";
    this.PROFILE_UPDATED_KEY = "PROFILE_UPDATED";
  }

  componentDidMount(){
    this.logInRequest(this.props.mobile_number);
    this.listenMessage();
  }

  componentWillUnmount(){
    this.subscription.remove();
  }

  showAlert(msg, title='Invalid Data Filled', cb=()=>{}){
    Alert.alert(
      title,
      msg,
      [
        { 
          text: 'OK', onPress: () => {
            cb();
          } 
        }
      ],
      { cancelable: false }
    ); //dgfgf
  }

  setResendEnabled = () => {
    this.setState({resendEnabled: true})
  }

  listenMessage(){
      this.subscription = SmsListener.addListener(message => {
      //let verificationCodeRegex = /Your Verification Code Is ([\d]{4})/
      
      console.log("Message Listned");
      console.log(message);

      //"Your Verification Code Is 4128"
      let words = message.body.split(" ");
      let isValidOtp = /^\d+$/.test(words[4]) && words[4].length == 6;

      if (words[0]=="Your" && words[1]=="Verification" && words[2]=="Code" && words[3]=="Is" && isValidOtp) {
        //let verificationCode = message.body.match(verificationCodeRegex)[1]

        //console.log(verificationCode);
        this.setState({
          inp0:words[4][0],
          inp1:words[4][1],
          inp2:words[4][2],
          inp3:words[4][3],
          inp4:words[4][4],
          inp5:words[4][5],
        });
      }
    });
  }

  logInRequest(mobile_number){
    const FormData = require('form-data');
    const axios = require('axios');

    const form = new FormData();
    form.append("mobileno", mobile_number);

    axios({
      url: "https://abstore.co.in/adminpanel/api/auth/myCartLogin",
      method: "POST",
      headers:{
        "Content-type": "application/x-www-form-urlencoded; boundary="+form._boundary,
      },
      data:form
    })
    .then(res=>{
      //console.log(res)
      //x = {"message": "OTP Sent", "sms_result": {"result": {"message": "5f97c8f9d6fc0526ea604897", "type": "success"}, "status": true}, "status": true, "userid": "9", "username": "7230914900"}
      this.userid = res.data.userid;
      this.username = res.data.username;
      console.log(res.data);
    })
    .catch(error=>{
      console.log(error);
      this.showAlert("Please check if you have internet connection, or try again", "Error");
      this.timerRef.stop();
      this.subscription.remove();
      this.props.closeModal();
    });
  }

  isDigit(num){
    return /^\d+$/.test(num) && num.length == 1;
  }

  isProfileUpdated(data){
    if(data.userid !== null || data.fullname !== null || data.address !== null || data.area !== null || data.district !== null || data.mobileno !== null || data.emailid !== null || data.photo_path != null){
      if(data.userid.length < 1 || data.fullname.length < 1 || data.address.length < 1 || data.area.length < 1 || data.district.length < 1 || data.mobileno.length < 1 || data.emailid.length < 1 || data.photo_path.length < 1){
        return false;
      } else {
        return true;
      }
    } else {
      return false;
    }

    return false;
  }

  verifyOtpReceived(){
    const FormData = require('form-data');
    const axios = require('axios');

    if(this.state.inp0.length != 1 || this.state.inp1.length != 1 || this.state.inp2.length != 1 || this.state.inp3.length != 1 || this.state.inp4.length != 1 || this.state.inp5.length != 1){
      this.showAlert("Invalid otp", "Error");
    } else if(!this.isDigit(this.state.inp0) || !this.isDigit(this.state.inp1) || !this.isDigit(this.state.inp2) || !this.isDigit(this.state.inp3)){
      this.showAlert("Invalid otp", "Error");
    } else {
      const form = new FormData();

      const password = this.state.inp0 + this.state.inp1 + this.state.inp2 + this.state.inp3 + this.state.inp4 + this.state.inp5; 

      //console.log(typeof this.userid);
      const loc = this.props.location.split(',');
      console.log(password+", "+this.userid+", "+this.username+",lati: "+loc[0]+", longi: "+loc[1]);

      form.append("userid", this.userid);
      form.append("latitude", loc[0]);
      form.append("longitude", loc[1]);
      form.append("username", this.username);
      form.append("password",password);
      form.append("grant_type","password");

      axios({
        url: "https://abstore.co.in/adminpanel/api/auth/myCartLoginVerify",
        method: "POST",
        headers:{
          "Content-type": "application/x-www-form-urlencoded; boundary="+form._boundary,
          "Authorization": "Basic dGVzdGNsaWVudDp0ZXN0c2VjcmV0"
        },
        data: form
      })
      .then(res=>{
        //user can now enter into home
        console.log("Came here");
        console.log(res.data);
        this.token_data = res.data;
        this.logged_in = true;

        //let is_otp_verified = isOTPVerified("xxx");
        
        return AsyncStorage.setItem(
          this.TOKEN_KEY,
          JSON.stringify(res.data)
        );
      })
      .then(()=>{
        console.log("Token stored in async storage");
        
        return AsyncStorage.setItem(
          this.LOGGED_IN_KEY,
          this.logged_in.toString()
        );
      })
      .then(()=>{
        //this.logged_in = true;
        //console.log(res.data);  
        console.log("Everything is alright while logging in");
        //show spinner while getting profile details, after getting update App state.
        const form2 = new FormData();
        form2.append("userid", this.userid)

        //this.token_data = res.data;

        return axios({
          url: "https://abstore.co.in/adminpanel/api/profile",
          method: "GET",
          headers:{
            "Content-type": "application/x-www-form-urlencoded; boundary="+form._boundary,
            "Authorization": "Bearer "+ this.token_data.access_token
          },
          data: form2
        });
      })
      .then((res)=>{
          console.log("Profile response");
      	  console.log(res.data);
	
	        this.is_profile_updated = this.isProfileUpdated(res.data);

	        return AsyncStorage.setItem(
            this.PROFILE_UPDATED_KEY,
            this.is_profile_updated.toString()
          );
      })
      .then(()=>{
        console.log("is_profile_updated is stored in async storage now");
        this.props.updateLoginProfileState(this.logged_in, this.is_profile_updated);
      })
      .catch((error)=>{
        console.log("hey");
        console.log(error);
        this.props.updateLoginProfileState(this.logged_in, this.is_profile_updated);
        //this.showAlert("May be the OTP you just entered is wrong. Please resend OTP if you see this error twice\n"+error,"Something is wrong");
      });
    }
  }

  getInpVal(index){
    if(index == "inp0")
      return this.state.inp0;
    else if(index == "inp1")
      return this.state.inp1;
    else if(index == "inp2")
      return this.state.inp2;
    else if(index == "inp3")
      return this.state.inp3;
    else if(index == "inp4")
      return this.state.inp4;
    else
      return this.state.inp5;
  }

  setInpVal(index, n){
    if(index == "inp0"){
        this.setState({inp0: n});
        if(n.length == 1)
          this.inpRefs[1].focus();
    } else if(index == "inp1") {
        this.setState({inp1: n});
        if(n.length == 1)
          this.inpRefs[2].focus();
    }else if(index == "inp2") {
        this.setState({inp2: n});
        if(n.length == 1)
          this.inpRefs[3].focus();
    } else if(index == "inp3") {
      this.setState({inp3: n});
      if(n.length == 1)
        this.inpRefs[4].focus();
    } else if(index == "inp4") {
      this.setState({inp4: n});
      if(n.length == 1)
        this.inpRefs[5].focus();
    }
    else {
        this.setState({inp5: n});
    }
  }

  setRefs(index, inp_ref){
    if(index == "inp0")
      this.inpRefs[0] = inp_ref;
    else if(index == "inp1")
      this.inpRefs[1] = inp_ref;
    else if(index == "inp2")
      this.inpRefs[2] = inp_ref;
    else if(index == "inp3")
      this.inpRefs[3] = inp_ref;
    else if(index == "inp4")
      this.inpRefs[4] = inp_ref;
    else
      this.inpRefs[5] = inp_ref;
  }

  render(){
    const otpInputs = ["inp0","inp1","inp2","inp3","inp4","inp5"];

    const renderOtpInputs = otpInputs.map((index) => {
      return (
        <TextInput
          placeholder="0"
          ref = {inp_ref => {this.setRefs(index, inp_ref)}}
          autoCapitalize="none"
          editable={true}
          keyboardType="numeric"
          key={index}
          style={{borderBottomColor: "gray", borderBottomWidth:1, textAlign:"center"}}
          onChangeText={n => {
            if(n.length <= 1)
              this.setInpVal(index, n);
            console.log(this.state);
          }}
          value={this.getInpVal(index)}
        />
      )
    })

    return (
      <View style={{flex:1, flexDirection:'column', alignItems:"center", justifyContent:'center'}}>
        <Text style={{fontSize:20}}>Verify your Account</Text>
        <Text style={{marginTop:"3%", marginBottom:"3%", textAlign:'center'}}>{"Please enter OTP sent on your mobile no. "+this.props.mobile_number}</Text>
        <View style={{flexDirection:'row', justifyContent:'space-between', width: '60%'}}>
          {renderOtpInputs}
        </View>
        <Button style={{elevation:10, alignSelf: "center", backgroundColor:'#F57C00', marginTop: "8%"}} rounded
          onPress={()=>{
            this.verifyOtpReceived();
          }}
        >
          <Text style={{color:"white", paddingLeft:"10%", paddingRight:'10%' ,fontSize:16}}>Verify</Text>
        </Button>
        <Text style={{textAlign:'center', marginTop:"5%", width:'60%'}}>
          {"Click on resend button if you did not receive OTP in "}
          <Timer ref = {tRef => {this.timerRef = tRef}} enableResend={this.setResendEnabled}/>
          {" seconds"}
        </Text>
        <Button disabled={!this.state.resendEnabled} style={{elevation:10, alignSelf: "center", backgroundColor: this.state.resendEnabled?'#F57C00':'#FFCC80', marginTop: "2%"}} rounded onPress={()=>{}}
          onPress={()=>{
            if(this.state.resendEnabled){
              this.timerRef.start();
              this.setState({resendEnabled: false});
              this.logInRequest(this.props.mobile_number);
            }
          }}
        >
          <Text style={{color:"white", paddingLeft:"2%", paddingRight:'2%' ,fontSize:14}}>Resend</Text>
        </Button>
      </View>
    );
  }
}

//globals consts, and vars - start, go downside for Login Component

const slides = [
    {
      key: 's1',
      image: {
          uri: 'https://raw.githubusercontent.com/AboutReact/sampleresource/master/intro_discount.png',
      }
    },
    {
      key: 's2',
      //title: 'Best Deals',
      //text: ' Best Deals on all our services',
      image: {
        uri:
          'https://raw.githubusercontent.com/AboutReact/sampleresource/master/intro_best_deals.png',
      },
      //backgroundColor: '#3395ff',
    },
    {
      key: 's3',
      //title: 'Bus Booking',
      //text: 'Enjoy Travelling on Bus with flat 100% off',
      image: {
        uri:
          //'https://abstore.co.in/adminpanel/writable/uploads/softprop/53/photo_path_20201028181934.png'
          'https://raw.githubusercontent.com/AboutReact/sampleresource/master/intro_bus_ticket_booking.png',
      },
      //backgroundColor: '#f6437b',
    },
  ];
  
  const styles = StyleSheet.create({
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent:"center",
      backgroundColor: '#F57C00'
    },
    image: {
      width: 320,
      height: 320,
      marginVertical: 32
    },
    text: {
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
    },
    title: {
      fontSize: 22,
      color: 'white',
      textAlign: 'center',
    },
    textInput: {
      height: 40,
      width: '80%',
      borderBottomColor: 'gray',
      backgroundColor: 'white',
      borderBottomWidth: 1,
      fontSize: 15,
      marginTop: 20
    },
  });


export default class Login extends React.Component {
      constructor(props){
          super(props);

          this.state = {
            showRealApp: false,
            number: '',
            verifyVisible: false,
            currentSlide: 0
          }

          console.log(props.slides);

          this.deviceSize = Dimensions.get('window');
          this.slider = null;
      }

      componentDidMount(){
        this.requestReadSmsPermission();
        //Geolocation.clearWatch(this.watchID);
      }

      async requestReadSmsPermission() {
        try {
        var granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        {
        title: "Auto Verification OTP",
        message: "need access to read sms, to verify OTP"
        }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("sms read permissions granted", granted); 
        granted = await PermissionsAndroid.request( 
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,{ 
        title: "Receive SMS",
        message: "Need access to receive sms, to verify OTP"
        }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("RECEIVE_SMS permissions granted", granted);
        } else {
        console.log("RECEIVE_SMS permissions denied");
        }
        } else {
        console.log("sms read permissions denied");
        }
        } catch (err) {
        console.log(err);
        }
      }

      _renderItem = ({ item }) => {
        console.log("Item is:---");
        console.log(item);
        return (
          <View style={styles.slide}>
              <Image style={{width:225, height:225, position: 'absolute', top:this.deviceSize.height*0.15}} source={item.image} />
              {true?(<></>):(<View style={{justifyContent:'space-between',position:'absolute', top: this.deviceSize.height*0.40, alignItems:'center'}}>
                <Text style={{color:'white', fontSize: 25}}>{/*item.title*/}</Text>
                <Text style={{color:'white', width: '70%', textAlign:'center'}}>{/*item.text*/}</Text>
              </View>)}
          </View>
        );
      }

      _onSlideChange = (index, lastIndex) => {
        this.setState({currentSlide: index});
      }

      _onDone = () => {
        // User finished the introduction. Show real app through
        // navigation or simply by controlling state
        this.setState({ showRealApp: true });
      }

      showAlert(msg, title='Invalid Data Filled', cb=()=>{}){
		    Alert.alert(
			    title,
			    msg,
			    [
			      { 
				      text: 'OK', onPress: () => {
				  	    cb();
				      } 
			      }
			    ],
			    { cancelable: false }
	      ); //dgfgf
    }
    
      closeVerify = () => {
        this.setState({verifyVisible: false});
      }

      render() {
        const renderSlideCircle = this.props.slides.map((item)=>{
          return (
            <View key={item.key} style={{width: 8, height: 8, borderRadius: 4, borderColor: "white", borderWidth:1, backgroundColor:(parseInt(item.key[1])-1)==this.state.currentSlide?'white':'#F57C00'}}></View>
          );
        });

        if (this.state.showRealApp) {
          return <Text>Hello</Text>;
        } else {
          return (
            <>
            <StatusBar translucent backgroundColor="transparent" />
            <AppIntroSlider ref={slider => {this.slider = slider}} onSlideChange={this._onSlideChange} renderItem={this._renderItem} data={this.props.slides} onDone={this._onDone}/>
            <View style={{position:'absolute', top: this.deviceSize.height*0.60, flexDirection:'row', width: '10%', justifyContent:'space-between', alignSelf:'center'}}>
                {renderSlideCircle}
            </View>
            <Card style={{flex:1, flexDirection:'column' ,margin:0 ,elevation:10 ,position:'absolute', width: '90%', height:'28%', backgroundColor:'white', borderRadius: 5, bottom: 0, alignItems: 'center', justifyContent:'center',left: this.deviceSize.width*0.05}}>
              <Text style={{fontSize:20, marginTop: 10}}>Enter Number</Text>
              {true?(<></>):(<Text style={{color:'gray', marginTop:10}}>Previous logged in no. 7234546976</Text>)}
              <TextInput
                placeholder="Mobile Number (10 Digit)"
                autoCapitalize="none"
                editable={true}
                keyboardType="numeric"
                style={styles.textInput}
                onChangeText={number => this.setState({ number })}
                value={this.state.number}
              />
              {false?(<Text style={{color:'gray', fontSize: 15, width: "80%", textAlign:"center", marginTop:15}}>
                {"By tapping continue, I agree to the "} 
                <Text style={{color:"black", textDecorationLine:'underline'}}>
                  {"Terms of Use"}
                </Text>
              </Text>):(<View></View>)}
              <Button style={{elevation:10, alignSelf: "center", backgroundColor:'#F57C00', marginTop: "8%"}} rounded onPress={()=>{}}
                onPress={()=>{
                    let isValidNumber = /^\d+$/.test(this.state.number) && this.state.number.length == 10;
                    if(isValidNumber)
                      this.setState({verifyVisible: true});  
                    else
                      this.showAlert("Phone number is not valid!. It must be 10 digits long.", "Alert");
                }}
              >
                  <Text style={{color:"white", paddingLeft:"10%", paddingRight:'10%' ,fontSize:16}}>Continue</Text>
              </Button>
              {true?(<View></View>):(<Button style={{alignSelf:'center', marginTop: "4%"}} transparent light androidRippleColor="#00c853"
                onPress={()=>{
                    this.showAlert("Explore clicked!","Alert");
                    //this.slider.goToSlide(2);, use it for auto sliding
                }}
              >
                <Text style={{fontWeight: "bold"}}>EXPLORE NOW</Text>
              </Button>)}
            </Card>
            <Modal 
  			      animationType={"fade"}  
  			      visible={this.state.verifyVisible} 
  			      onRequestClose={()=>{
			          this.setState({verifyVisible: false});
			        }}
  	  		  >
				      <VerifyOTP location={this.props.location} mobile_number={this.state.number} closeModal={this.closeVerify} updateLoginProfileState={this.props.updateLoginProfileState}/>
			      </Modal>
            </>
          );
        }
      }
}