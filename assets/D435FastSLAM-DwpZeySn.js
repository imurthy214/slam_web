const e=`// Generated from CogniPilot/modelica_models 1e0afae78308b7596c9ff6fc1bd6adf5b03567a2; edit the canonical packages there.\r
// Native-camera entrypoints for the complete authored SLAM processing graph.\r
// Native RGB8/Z16 shape and depth-scale bindings: math and State are shared\r
// with the parameterized entrypoints. These targets still require Rumoca WASM\r
// issuance and end-to-end browser qualification before runtime admission.\r
model D435FastSLAMInitialize\r
\r
  extends RGBDFastSLAMInitialize(imageHeight=D435ImageProfile.height,\r
    imageWidth=D435ImageProfile.width,channelCount=D435ImageProfile.colorChannels,\r
    depthUnits=D435ImageProfile.depthUnits);\r
end D435FastSLAMInitialize;\r
\r
model D435FastSLAMStep\r
\r
  extends RGBDFastSLAMStep(imageHeight=D435ImageProfile.height,\r
    imageWidth=D435ImageProfile.width,channelCount=D435ImageProfile.colorChannels,\r
    depthUnits=D435ImageProfile.depthUnits);\r
end D435FastSLAMStep;\r
\r
model D435FastSLAMIntervals\r
\r
  extends RGBDFastSLAMIntervals(imageHeight=D435ImageProfile.height,\r
    imageWidth=D435ImageProfile.width,channelCount=D435ImageProfile.colorChannels,\r
    depthUnits=D435ImageProfile.depthUnits);\r
end D435FastSLAMIntervals;\r
`;export{e as default};
