/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React, {useEffect, useState} from 'react';
import type {Node} from 'react';
import {
  Button,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import {Colors} from 'react-native/Libraries/NewAppScreen';
import BackgroundTimer from 'react-native-background-timer';
import { Formik, Form, Field, ErrorMessage } from "formik";
import MetaMaskSDK from '@metamask/sdk';
import axios from 'axios';
import * as ImagePicker from "react-native-image-picker"
import { NFTStorage, File, Blob } from "nft.storage/dist/bundle.esm.min.js";
//import { NFTStorage, File,Blob } from 'nft.storage'
import {Contract, ethers} from 'ethers';
//import { DocumentDirectoryPath, writeFile } from 'react-native-fs';

const REACT_APP_PINATA_API_KEY= "95910e3a2d72534dcc78";
const REACT_APP_PINATA_API_SECRET= "7e06f62f3d670e5cd15cd6196caa2ee3f1013039817197479607105140a6d829";
var creatingNft = false;

const sdk = new MetaMaskSDK({
  
  openDeeplink: link => {
    console.log(link)
    Linking.openURL(link);
  },
  timer: BackgroundTimer,
  dappMetadata: {
    name: 'React Native Test Dapp',
    url: 'example.com',
  },
});

const ethereum = sdk.getProvider();
const API_KEY_NFT_STORAGE = "feyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDVhODk1Qzc5RmI4NGU2MGFCM0FCMWUyQTUyODIxMzEyZUQxMjAyODMiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY3NTQ1MzcyMDE3OSwibmFtZSI6InRlc3Rtb2JpbGUifQ.hP2DVah31QQa6Ko7XodNbrMPdE5a88Bm4M1VGsW8SCQ";
const provider = new ethers.providers.Web3Provider(ethereum);

const App: () => Node = () => {
  const [response, setResponse] = useState();
  const [account, setAccount] = useState();
  const [chain, setChain] = useState();
  const [balance, setBalance] = useState();

  //variables to get media data
  const [resourcePath, setresourcePath ] = useState({
    assets:[{
      uri: null,
    }]
  });
  const [filePath, setfilePath ] = useState();
  const [fileData, setfileData ] = useState();
  const [fileUri, setfileUri ] = useState();
  const [blobimgtoNft, setblobimgtoNft] = useState();
 
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const textStyle = {
    color: isDarkMode ? Colors.lighter : Colors.darker,
    margin: 10,
    fontSize: 16,
  };

  // Get blob from mobile img
  async function getExampleImage() {
    const blobfile = await (await fetch(`${resourcePath.assets[0].uri}`)).blob();
    return blobfile  
  }
  
  //functions to connect media with app
  const selectFile = () => {
    var options = {
      title: 'Select Image',
      customButtons: [
        { 
          name: 'customOptionKey', 
          title: 'Choose file from Custom Option' 
        },
      ],
      storageOptions: {
        skipBackup: true,
        path: 'images',
      },
    };

    imageGalleryLaunch();
    //console.log("TEST",resourcePath.assets[0].uri)
  };

  const imageGalleryLaunch = () => {
    let options = {  
      storageOptions: {  
        skipBackup: true,  
        path: 'images',
        base64: true,  
      },  
    };

    ImagePicker.launchImageLibrary(options, (res) => {  
      //console.log('Response = ', res);  
      if (res.didCancel) {
          console.log('User cancelled image picker');  
      } else if (res.error) {  
        console.log('ImagePicker Error: ', res.error);  
      } else if (res.customButton) {  
        console.log('User tapped custom button: ', res.customButton);  
        alert(res.customButton);  
      } else {  
        const source = { uri: res.uri };  
        //console.log('response', JSON.stringify(res));
        setresourcePath(res);
        setfilePath(res)
        setfileData(res.data);
        setfileUri(res.uri);
      }  
    });  
  }

  //end code connect media to app
  const getBalance = async () => {
    if (!ethereum.selectedAddress) {
      return;
    }
    const bal = await provider.getBalance(ethereum.selectedAddress);
    setBalance(ethers.utils.formatEther(bal));
  };

  useEffect(() => {
    ethereum.on('chainChanged', chain => {
      console.log(chain);
      setChain(chain);
    });
    ethereum.on('accountsChanged', accounts => {
      console.log(accounts);
      setAccount(accounts?.[0]);

      getBalance();
    });
    ethereum.on('message', message => {
      console.log("LLEGA!!!===>",message);
      //setAccount(accounts?.[0]);

      getBalance();
    });
  }, []);

  /* this.provider.on('message', message => {
    self.providerMessage(message)
  }) */
  const connect = async () => {
    try {
      const result = await ethereum.request({method: 'eth_requestAccounts'});
      console.log('RESULT', result?.[0]);
      setAccount(result?.[0]);
      getBalance();
    } catch (e) {
      console.log('ERROR', e);
    }
  };

  const exampleRequest = async () => {
    try {
      const result = await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x13881',
            chainName: 'Polygon',
            blockExplorerUrls: ['https://polygonscan.com'],
            nativeCurrency: {symbol: 'MATIC', decimals: 18},
            rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
          },
        ],
      });
      console.log('RESULT', result);
      setResponse(result);
    } catch (e) {
      console.log('ERROR', e);
    }
  };

  const sign = async () => {
    const msgParams = JSON.stringify({
      domain: {
        // Defining the chain aka Rinkeby testnet or Ethereum Main Net
        chainId: parseInt(ethereum.chainId, 16),
        // Give a user friendly name to the specific contract you are signing for.
        name: 'Ether Mail',
        // If name isn't enough add verifying contract to make sure you are establishing contracts with the proper entity
        verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        // Just let's you know the latest version. Definitely make sure the field name is correct.
        version: '1',
      },

      // Defining the message signing data content.
      message: {
        /*
         - Anything you want. Just a JSON Blob that encodes the data you want to send
         - No required fields
         - This is DApp Specific
         - Be as explicit as possible when building out the message schema.
        */
        contents: 'Hello, Bob!',
        attachedMoneyInEth: 4.2,
        from: {
          name: 'Cow',
          wallets: [
            '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            '0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF',
          ],
        },
        to: [
          {
            name: 'Bob',
            wallets: [
              '0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB',
              '0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57',
              '0xB0B0b0b0b0b0B000000000000000000000000000',
            ],
          },
        ],
      },
      // Refers to the keys of the *types* object below.
      primaryType: 'Mail',
      types: {
        // TODO: Clarify if EIP712Domain refers to the domain the contract is hosted on
        EIP712Domain: [
          {name: 'name', type: 'string'},
          {name: 'version', type: 'string'},
          {name: 'chainId', type: 'uint256'},
          {name: 'verifyingContract', type: 'address'},
        ],
        // Not an EIP712Domain definition
        Group: [
          {name: 'name', type: 'string'},
          {name: 'members', type: 'Person[]'},
        ],
        // Refer to PrimaryType
        Mail: [
          {name: 'from', type: 'Person'},
          {name: 'to', type: 'Person[]'},
          {name: 'contents', type: 'string'},
        ],
        // Not an EIP712Domain definition
        Person: [
          {name: 'name', type: 'string'},
          {name: 'wallets', type: 'address[]'},
        ],
      },
    });

    var from = ethereum.selectedAddress;

    var params = [from, msgParams];
    var method = 'eth_signTypedData_v4';

    const resp = await ethereum.request({method, params});
    setResponse(resp);
  };

  const sendTransaction = async () => {
    const to = '0x0000000000000000000000000000000000000000';
    const transactionParameters = {
      to, // Required except during contract publications.
      from: ethereum.selectedAddress, // must match user's active address.
      value: '0x5AF3107A4000', // Only required to send ether to the recipient from the initiating external account.
    };

    try {
      // txHash is a hex string
      // As with any RPC call, it may throw an error
      const txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      setResponse(txHash);
    } catch (e) {
      console.log(e);
    }
  };
  //const to conect smart contract
  const contractNft = require("./abicontract.json");
  const CONTRACT_ADDRESS = "0xa1Ad7132c493aa058B85D41B5791EFA6a8FdcADE";
  
  
  
  const createCollectionNft = async (ipfsobject) => {
    const nftContract = new ethers.Contract(CONTRACT_ADDRESS, contractNft,provider);
    const signer = provider.getSigner()
    const nftContractWithSigner = nftContract.connect(signer)
    
    let objTmp = {
      _contractName: ipfsobject.value.data.name,
      _uri:ipfsobject.value.url,
      _ids:[1],
      _names:[ipfsobject.value.data.name],
    };
    console.log(objTmp);
    /* let transactionParameters = {
      to:CONTRACT_ADDRESS, 
      from: ethereum.selectedAddress, 
      data: nftContractWithSigner.deployERC1155(objTmp._contractName, objTmp._uri, objTmp._ids, objTmp._names),
      
    }; */
    //console.log(transactionParameters.data);
    creatingNft = true;
    await ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        to:CONTRACT_ADDRESS, 
        from: ethereum.selectedAddress, 
        data: nftContractWithSigner.deployERC1155(objTmp._contractName, objTmp._uri, objTmp._ids, objTmp._names),
        
      }],
    }).then((tx) => {
      console.log("AQUI!!!!!!!===>>>")
      console.log(tx)
      if(tx){
        //setResponse(tx);
        mintERC1155(ipfsobject);
      }
    })/* .catch((error) => {
      if (error.code === 4001) {
        // EIP-1193 userRejectedRequest error
        console.log('Permissions needed to continue.');
      } else {
        //createCollectionNft();
      }
    }); */
    console.log("VOLVIO!!!!!!!===>>>")
  };
  async function getGasPrice() {
    let feeData = await provider.getFeeData()
    return feeData.gasPrice
  }

  async function getNonce(signer) {
    return (await signer).getTransactionCount()
  }
 
  const mintERC1155 = async (ipfsobject) => {
    console.log("llegamos hasta aqui QQQQQQQ");
    const nftContract = await new ethers.Contract(CONTRACT_ADDRESS, contractNft,provider);
    const signer = provider.getSigner();
    const nftContractWithSigner = nftContract.connect(signer);

    const nonce = await getNonce(signer)
    const gasFee = await getGasPrice();

    let mintObjTmp = {
      _index: 1,
      _name:"monkey",
      amount:1,
      gasfee: {
        gasPrice: gasFee,
        gasLimit: 600000, 
        nonce: nonce
    },
    };

    const transactionParameters = {
      to:CONTRACT_ADDRESS, 
      from: ethereum.selectedAddress, 
      data: nftContractWithSigner.mintERC1155(mintObjTmp._index, mintObjTmp._name, mintObjTmp.amount),
      
    };

    await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
    }).then((tx) => {
      if(tx){
        setResponse(tx);
      }
    });

  }


async function sendFileToIPFS(dataform){

  let fileImg = resourcePath.assets[0];
  console.log("IMG==>",resourcePath.assets[0])
  let json;
  try {
  const uploadimg = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${API_KEY_NFT_STORAGE}`,
          'Content-Type': 'image/png',
          'Content-Disposition': 'form-data',
          'name':"newbie",
          'filename':"mewbie.png"
      },
      body: fileImg
  });
  json = await uploadimg.json();
  }catch(error) {
    console.error('Error:', error);
  };

  let jsonstore;
  if (json) {
    console.log('Use the JSON here!', json);
    
    
    const formstorage = new FormData();

    let objectmeta = {}
    objectmeta.meta =
      {
        "name":dataform.namenft,
        "image":"https://"+json.value.cid+".ipfs.nftstorage.link/",
        "description":dataform.description,
        "keyvalues":
          {
            "LawyerName":"Lawyer001",
            "ClientID":"Client002",
            "ChargeCode":"Charge003",
            "Cost":dataform.amountnft
          }
      }
 
    formstorage.append('meta', JSON.stringify(objectmeta.meta));
    
    try {
    const storeimg = await fetch('https://api.nft.storage/store', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY_NFT_STORAGE}`,           
        },
        body: formstorage
    });
    jsonstore = await storeimg.json();
    }catch(error) {
      console.error('Error:', error);
    };
  }

  if(jsonstore){
    console.log("SE ALMACENA=>",jsonstore)
    createCollectionNft(jsonstore);
  }
}


  
  async function handleChangeForm(dataform){
    
    //console.log(resourcePath)
    //console.log(dataform)
    // namenft: "", description: "", amountnft:"" }}
    // 1 - upload data to nftstorage
    //let imageToNft = await getExampleImage();
    // 2 - create nft
    let imageToNft = await getExampleImage()
    //console.log("IMGAGE BLOB---->",blobimgtoNft);
    const nft = {
      imageToNft, // use image Blob as `image` field
      name: dataform.namenft,
      description: dataform.description,
      properties: {
        type: "My-NFT",
        origins: {
          http: "https://mynft.com",
          ipfs: "ipfs://bafybeieh4gpvatp32iqaacs6xqxqitla4drrkyyzq6dshqqsilkk3fqmti/blog/post/2021-11-30-hello-world-nft-storage/"
        },
        authors: [{ name: "@elchuo160" }],
        content: {
          "text/markdown": "The last year has witnessed the explosion of NFTs onto the world’s mainstage. From fine art to collectibles to music and media, NFTs are quickly demonstrating just how quickly grassroots Web3 communities can grow, and perhaps how much closer we are to mass adoption than we may have previously thought. <... remaining content omitted ...>"
        },
        amountnft:dataform.amountnft,
      }
    }
  
    console.log("NFT==>",nft)
    const client = new NFTStorage({ token: API_KEY_NFT_STORAGE })
    console.log(client);
    const metadata = await client.store(nft)
  
    console.log('NFT data stored!')
    console.log('Metadata URI: ', metadata.url)
  }
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={backgroundStyle}>
      <Text  style={{
                      
                      borderRadius: 10,
                      height: 20,
                      justifyContent: "center",
                      alignItems: "center",
                    }}>{`Create your own NFT collection`}</Text>

        <View style={styles.container}>
          <View style={styles.container}>
            <Image
              source={{
                uri: 'data:image/jpeg;base64,' + resourcePath.assets[0].uri,
              }}
              style={{ width: 100, height: 100 }}
            />
            <Image
              source={{ uri: resourcePath.assets[0].uri }}
              style={{ width: 200, height: 200 }}
            />
            <TouchableOpacity onPress={selectFile} style={styles.button}>
                <Text style={styles.buttonText}>Select File</Text>
            </TouchableOpacity>   
        </View>
      </View>
      <View style={{ marginTop: 30 }}>
            <Formik
              initialValues={{ namenft: "", description: "", amountnft:"" }}
              validateOnMount={true}
             
              onSubmit={(values) => sendFileToIPFS(values)}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                touched,
                values,
                errors,
                isValid,
              }) => (
                <View>
                  <View
                    style={{
                      flexDirection: "row",
                      borderBottomWidth: 1,
                      borderBottomColor: "#808080",
                      marginBottom: 5,
                      alignItems: "center",
                    }}
                  >
                    
                    <TextInput
                      style={{ marginLeft: 10 }}
                      onChangeText={handleChange("namenft")}
                      onBlur={handleBlur("namenft")}
                      value={values.namenft}
                      placeholder="Name NFT"
                    />
                  </View>
                  <View style={{ marginBottom: 20 }}>
                    {errors.email && touched.email ? (
                      <Text style={{ color: "red", fontSize: 15 }}>
                        {errors.email}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={{
                      flexDirection: "row",

                      borderBottomWidth: 1,
                      borderBottomColor: "#808080",
                      marginBottom: 5,
                      alignItems: "center",
                    }}
                  >
                    
                    <TextInput
                      style={{ marginLeft: 10 }}
                      placeholder="Description"
                      onChangeText={handleChange("description")}
                      onBlur={handleBlur("description")}
                      value={values.description}
                    />
                  </View>
                  


                  <View
                    style={{
                      flexDirection: "row",

                      borderBottomWidth: 1,
                      borderBottomColor: "#808080",
                      marginBottom: 5,
                      alignItems: "center",
                    }}
                  >
                    
                    <TextInput
                      style={{ marginLeft: 10 }}
                      placeholder="amount"
                      onChangeText={handleChange("amountnft")}
                      onBlur={handleBlur("amountnft")}
                      value={values.amountnft}
                    />
                  </View>



                  <View style={{ marginBottom: 20 }}>
                    {errors.password && touched.password ? (
                      <Text style={{ color: "red", fontSize: 15 }}>
                        {errors.password}
                      </Text>
                    ) : null}
                  </View>

                  <View
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        marginBottom: 30,
                        alignItems: "center",
                      }}
                    >
                      
                      
                    </View>

                    
                  </View>

                  <Button title='CREATE'
                    style={{
                      backgroundColor: "#597ac2",
                      borderRadius: 10,
                      height: 35,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 15,
                    }}
                    onPress={handleSubmit}
                  >
                   
                  </Button>
                </View>
              )}
            </Formik>
          </View>

          <Text  style={{
                      
                      borderRadius: 10,
                      height: 35,
                      justifyContent: "center",
                      alignItems: "center",
                    }}>{`----------------------------------------------------------------------------------------`}</Text>
    {/*   <Button title="Create NFT Collection" onPress={createCollectionNft} /> */}



        <Button title={account ? 'Connected' : 'Connect'} onPress={connect} />
        <Button title="Sign" onPress={sign} />
        <Button title="Send transaction" onPress={sendTransaction} />
        <Button title="Add chain" onPress={exampleRequest} />   
       <Button title="Mint NFT" onPress={mintERC1155} /> 
        <Text style={textStyle}>{chain && `Connected chain: ${chain}`}</Text>
        <Text style={textStyle}>
          {' '}
          {account && `Connected account: ${account}\n\n`}
          {account && balance && `Balance: ${balance} MATIC`}
        </Text>
        <Text style={textStyle}>
          {' '}
          {response && `Last request response: ${response}`}
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({

  container: {

    flex: 1,

    padding: 10,

    alignItems: 'center',

    justifyContent: 'center',

    backgroundColor: '#fff'

  },

  button: {

    width: 250,

    height: 60,

    backgroundColor: '#3740ff',

    alignItems: 'center',

    justifyContent: 'center',

    borderRadius: 4,

    marginBottom:12

  },

  buttonText: {

    textAlign: 'center',

    fontSize: 15,

    color: '#fff'

  }

});
export default App;