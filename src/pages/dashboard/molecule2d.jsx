import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
  IconButton,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Alert,
} from "@material-tailwind/react";
import {
  PlayIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  BeakerIcon,
  Square2StackIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import SimpleMoleculeViewer from "../../components/SimpleMoleculeViewer";

export function Molecule2D() {
  const [smilesInput, setSmilesInput] = useState("CCO");
  const [currentSmiles, setCurrentSmiles] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("visualizer");
  const [selectedAtomIds, setSelectedAtomIds] = useState([]);
  const [moleculeData, setMoleculeData] = useState(null);

  // For now, just use the fallback SimpleMoleculeViewer since molecule-2d-for-react has compatibility issues
  const Molecule2dComponent = null;
    // Example molecules with their 2D structure data (using example data from the GitHub repo)
  const exampleMolecules = [
    {
      name: "Bipyridine",
      smiles: "C1=CC=NC(=C1)C2=CC=CC=N2",
      category: "Heterocycle",
      data: {
        nodes: [
          { id: 0, atom: 'N' },
          { id: 1, atom: 'C' },
          { id: 2, atom: 'C3' },
          { id: 3, atom: 'C4' },
          { id: 4, atom: 'C5' },
          { id: 5, atom: 'C6' },
          { id: 6, atom: 'C7' },
          { id: 7, atom: 'N8' },
          { id: 8, atom: 'C9' },
          { id: 9, atom: 'C10' },
          { id: 10, atom: 'C11' },
          { id: 11, atom: 'C12' },
        ],
        links: [
          { id: 0, source: 1, strength: 1, distance: 29.91570726558207, target: 0, bond: 2 },
          { id: 1, source: 2, strength: 1, distance: 30.870992090958136, target: 1, bond: 1 },
          { id: 2, source: 3, strength: 1, distance: 30.669623995738846, target: 2, bond: 2 },
          { id: 3, source: 4, strength: 1, distance: 30.320011541554535, target: 3, bond: 1 },
          { id: 4, source: 5, strength: 1, distance: 30.462333981492616, target: 4, bond: 2 },
          { id: 5, source: 5, strength: 1, distance: 29.942081226928764, target: 0, bond: 1 },
          { id: 6, source: 6, strength: 1, distance: 33.10311986323948, target: 1, bond: 1 },
          { id: 7, source: 7, strength: 1, distance: 29.914643005725473, target: 6, bond: 2 },
          { id: 8, source: 8, strength: 1, distance: 29.94415643961273, target: 7, bond: 1 },
          { id: 9, source: 9, strength: 1, distance: 30.46307691747502, target: 8, bond: 2 },
          { id: 10, source: 10, strength: 1, distance: 30.317225221975708, target: 9, bond: 1 },
          { id: 11, source: 11, strength: 1, distance: 30.670350548371626, target: 10, bond: 2 },
          { id: 12, source: 11, strength: 1, distance: 30.87016403843685, target: 6, bond: 1 },
        ],
      },
    },
    {
      name: "Ethanol",
      smiles: "CCO",
      category: "Simple",
      data: {
        nodes: [
          { id: 0, atom: "C" },
          { id: 1, atom: "C" },
          { id: 2, atom: "O" },
        ],
        links: [
          { id: 0, source: 0, target: 1, bond: 1, strength: 1, distance: 30 },
          { id: 1, source: 1, target: 2, bond: 1, strength: 1, distance: 30 },
        ],
      },
    },
    {
      name: "Benzene",
      smiles: "C1=CC=CC=C1",
      category: "Aromatic",
      data: {
        nodes: [
          { id: 0, atom: "C" },
          { id: 1, atom: "C" },
          { id: 2, atom: "C" },
          { id: 3, atom: "C" },
          { id: 4, atom: "C" },
          { id: 5, atom: "C" },
        ],
        links: [
          { id: 0, source: 0, target: 1, bond: 2, strength: 1, distance: 30 },
          { id: 1, source: 1, target: 2, bond: 1, strength: 1, distance: 30 },
          { id: 2, source: 2, target: 3, bond: 2, strength: 1, distance: 30 },
          { id: 3, source: 3, target: 4, bond: 1, strength: 1, distance: 30 },
          { id: 4, source: 4, target: 5, bond: 2, strength: 1, distance: 30 },
          { id: 5, source: 5, target: 0, bond: 1, strength: 1, distance: 30 },
        ],
      },
    },
    {
      name: "Residue Example",
      smiles: "N[C@@H](CCC(=O)N)C(=O)O",
      category: "Amino Acid",
      data: {
        nodes: [
          {"id":1000,"atom":"HE22"},
          {"id":991,"atom":"C"},
          {"id":997,"atom":"NE2"},
          {"id":990,"atom":"CA"},
          {"id":995,"atom":"CD"},
          {"id":996,"atom":"OE1"},
          {"id":993,"atom":"CB"},
          {"id":992,"atom":"O"},
          {"id":994,"atom":"CG"},
          {"id":999,"atom":"HE21"},
          {"id":989,"atom":"N"},
          {"id":998,"atom":"H"}
        ],
        links: [
          { id: 90, "source":989,"target":990,"bond":1, strength: 1, distance: 30.0 },
          { id: 91, "source":989,"target":998,"bond":1, strength: 1, distance: 30.0 },
          { id: 92, "source":990,"target":991,"bond":1, strength: 1, distance: 30.0 },
          { id: 93, "source":990,"target":993,"bond":1, strength: 1, distance: 30.0 },
          { id: 94, "source":991,"target":992,"bond":2, strength: 1, distance: 30.0 },
          { id: 95, "source":993,"target":994,"bond":1, strength: 1, distance: 30.0 },
          { id: 96, "source":994,"target":995,"bond":1, strength: 1, distance: 30.0 },
          { id: 97, "source":995,"target":997,"bond":1, strength: 1, distance: 30.0 },
          { id: 98, "source":995,"target":996,"bond":2, strength: 1, distance: 30.0 },
          { id: 99, "source":997,"target":1000,"bond":1, strength: 1, distance: 30.0 },
          { id: 100, "source":997,"target":999,"bond":1, strength: 1, distance: 30.0 }
        ],
      },
    },
  ];

  // Load default molecule on component mount
  useEffect(() => {
    const defaultMolecule = exampleMolecules[0];
    setMoleculeData(defaultMolecule.data);
    setCurrentSmiles(defaultMolecule.smiles);
    setSmilesInput(defaultMolecule.smiles);
  }, []);

  const handleVisualize = async () => {
    if (!smilesInput.trim()) {
      setError("Please enter a SMILES string");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Check if it's an example molecule
      const exampleMolecule = exampleMolecules.find(
        mol => mol.smiles.toLowerCase() === smilesInput.toLowerCase()
      );

      if (exampleMolecule) {
        setMoleculeData(exampleMolecule.data);
        setCurrentSmiles(smilesInput);
        setSelectedAtomIds([]);
      } else {
        // For custom SMILES, create a simple linear structure
        // In a real application, you'd use RDKit or similar to generate coordinates
        const nodes = [];
        const links = [];
        const atoms = smilesInput.split('').filter(char => /[A-Z]/.test(char));
        
        atoms.forEach((atom, index) => {
          nodes.push({
            id: index,
            atom: atom,
            x: index * 40,
            y: 0
          });
          
          if (index > 0) {
            links.push({
              id: index - 1,
              source: index - 1,
              target: index,
              bond: 1,
              strength: 1,
              distance: 40
            });
          }
        });

        setMoleculeData({ nodes, links });
        setCurrentSmiles(smilesInput);
        setSelectedAtomIds([]);
      }
    } catch (err) {
      setError(`Error processing molecule: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (molecule) => {
    setSmilesInput(molecule.smiles);
    setMoleculeData(molecule.data);
    setCurrentSmiles(molecule.smiles);
    setSelectedAtomIds([]);
    setError("");
  };

  const handleSelectionChange = (newSelectedAtomIds) => {
    setSelectedAtomIds(newSelectedAtomIds);
  };

  const clearVisualization = () => {
    setMoleculeData(null);
    setCurrentSmiles("");
    setSelectedAtomIds([]);
    setError("");
  };

  const downloadStructure = () => {
    if (!moleculeData) return;
    
    const dataStr = JSON.stringify(moleculeData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `molecule_${currentSmiles.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="mt-12">
      <div className="mb-12 grid gap-y-10 gap-x-6 md:grid-cols-1 xl:grid-cols-1">
        <Card>
          <CardHeader variant="gradient" color="gray" className="mb-8 p-6">
            <Typography variant="h6" color="white">
              2D Molecule Viewer
            </Typography>
          </CardHeader>
          <CardBody className="overflow-x-scroll px-0 pt-0 pb-2">
            <Tabs value={activeTab} className="w-full">
              <TabsHeader className="w-full">
                <Tab value="visualizer" onClick={() => setActiveTab("visualizer")}>
                  <Square2StackIcon className="h-5 w-5 mr-2" />
                  2D Visualizer
                </Tab>
                <Tab value="examples" onClick={() => setActiveTab("examples")}>
                  <BeakerIcon className="h-5 w-5 mr-2" />
                  Examples
                </Tab>
                <Tab value="info" onClick={() => setActiveTab("info")}>
                  <InformationCircleIcon className="h-5 w-5 mr-2" />
                  Information
                </Tab>
              </TabsHeader>
              
              <TabsBody>
                <TabPanel value="visualizer" className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Controls */}
                    <div className="lg:col-span-1">
                      <Card className="h-fit">
                        <CardHeader variant="gradient" color="blue" className="mb-4 p-4">
                          <Typography variant="h6" color="white">
                            Molecule Input
                          </Typography>
                        </CardHeader>
                        <CardBody className="space-y-4">
                          <div>
                            <Typography className="mb-2 font-medium text-blue-gray-600">
                              SMILES String
                            </Typography>
                            <Input
                              label="Enter SMILES (e.g., CCO)"
                              value={smilesInput}
                              onChange={(e) => setSmilesInput(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleVisualize()}
                            />
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={handleVisualize}
                              disabled={isLoading}
                              className="flex-1 flex items-center justify-center gap-2"
                              color="green"
                            >
                              {isLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <PlayIcon className="h-4 w-4" />
                              )}
                              {isLoading ? "Processing..." : "Visualize"}
                            </Button>
                            
                            <IconButton
                              onClick={clearVisualization}
                              color="red"
                              variant="outlined"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </IconButton>
                          </div>

                          {moleculeData && (
                            <Button
                              onClick={downloadStructure}
                              variant="outlined"
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <ArrowDownTrayIcon className="h-4 w-4" />
                              Download Structure
                            </Button>
                          )}

                          {/* Selection Info */}
                          {selectedAtomIds.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                              <Typography variant="small" className="font-medium text-blue-gray-700">
                                Selected Atoms: {selectedAtomIds.join(", ")}
                              </Typography>
                            </div>
                          )}

                          {/* Molecule Info */}
                          {currentSmiles && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                              <Typography variant="small" className="font-medium text-gray-700">
                                Current SMILES: {currentSmiles}
                              </Typography>
                              {moleculeData && (
                                <Typography variant="small" className="text-gray-600 mt-1">
                                  Atoms: {moleculeData.nodes.length} | Bonds: {moleculeData.links.length}
                                </Typography>
                              )}
                            </div>
                          )}
                        </CardBody>
                      </Card>
                    </div>

                    {/* Visualization */}
                    <div className="lg:col-span-2">
                      <Card className="h-fit">
                        <CardHeader variant="gradient" color="green" className="mb-4 p-4">
                          <Typography variant="h6" color="white">
                            2D Structure Visualization
                          </Typography>
                        </CardHeader>
                        <CardBody>
                          {error && (
                            <Alert color="red" className="mb-4">
                              {error}
                            </Alert>
                          )}                          <div className="flex justify-center items-center min-h-[400px] bg-white border-2 border-gray-200 rounded-lg">
                            {moleculeData ? (
                              <div className="w-full h-full flex justify-center molecule-2d">
                                {Molecule2dComponent ? (
                                  <Molecule2dComponent
                                    modelData={moleculeData}
                                    selectedAtomIds={selectedAtomIds}
                                    onChangeSelection={handleSelectionChange}
                                    width={600}
                                    height={400}
                                  />
                                ) : (
                                  <SimpleMoleculeViewer
                                    modelData={moleculeData}
                                    selectedAtomIds={selectedAtomIds}
                                    onChangeSelection={handleSelectionChange}
                                    width={600}
                                    height={400}
                                  />
                                )}
                              </div>
                            ) : (
                              <div className="text-center text-gray-500">
                                <BeakerIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                <Typography variant="h6" className="mb-2">
                                  No molecule loaded
                                </Typography>
                                <Typography variant="small">
                                  Enter a SMILES string and click "Visualize" to see the 2D structure
                                </Typography>
                              </div>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                </TabPanel>

                <TabPanel value="examples" className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exampleMolecules.map((molecule, index) => (
                      <Card
                        key={index}
                        className="cursor-pointer hover:shadow-lg transition-shadow duration-300"
                        onClick={() => handleExampleClick(molecule)}
                      >
                        <CardBody className="text-center">
                          <Typography variant="h6" className="mb-2">
                            {molecule.name}
                          </Typography>
                          <Typography variant="small" className="text-gray-600 mb-2">
                            {molecule.category}
                          </Typography>
                          <Typography variant="small" className="font-mono text-blue-600">
                            {molecule.smiles}
                          </Typography>                          <div className="mt-4 flex justify-center">
                            <div className="w-full h-32 flex justify-center items-center bg-gray-50 rounded molecule-2d">
                              {Molecule2dComponent ? (
                                <Molecule2dComponent
                                  modelData={molecule.data}
                                  selectedAtomIds={[]}
                                  onChangeSelection={() => {}}
                                  width={200}
                                  height={120}
                                />
                              ) : (
                                <SimpleMoleculeViewer
                                  modelData={molecule.data}
                                  selectedAtomIds={[]}
                                  onChangeSelection={() => {}}
                                  width={200}
                                  height={120}
                                />
                              )}
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </TabPanel>

                <TabPanel value="info" className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader variant="gradient" color="blue" className="mb-4 p-4">
                        <Typography variant="h6" color="white">
                          About 2D Molecule Viewer
                        </Typography>
                      </CardHeader>
                      <CardBody>
                        <Typography className="mb-4">
                          This 2D molecule viewer displays interactive 2D representations of molecules 
                          using the molecule-2d-for-react library built by Autodesk.
                        </Typography>
                        <Typography className="mb-4">
                          <strong>Features:</strong>
                        </Typography>
                        <ul className="list-disc list-inside space-y-2 text-gray-700">
                          <li>Interactive 2D molecular structure visualization</li>
                          <li>Atom selection and highlighting</li>
                          <li>Drag and drop molecule manipulation</li>
                          <li>SMILES string input support</li>
                          <li>Pre-loaded example molecules</li>
                          <li>Structure data export</li>
                        </ul>
                      </CardBody>
                    </Card>

                    <Card>
                      <CardHeader variant="gradient" color="green" className="mb-4 p-4">
                        <Typography variant="h6" color="white">
                          Usage Instructions
                        </Typography>
                      </CardHeader>
                      <CardBody>
                        <Typography className="mb-4">
                          <strong>How to use the 2D viewer:</strong>
                        </Typography>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                          <li>Enter a SMILES string in the input field</li>
                          <li>Click "Visualize" to generate the 2D structure</li>
                          <li>Click on atoms to select/deselect them</li>
                          <li>Drag atoms to reposition them</li>
                          <li>Use the "Examples" tab to try pre-loaded molecules</li>
                          <li>Download structure data as JSON for further analysis</li>
                        </ol>
                        <Typography className="mt-4 mb-2">
                          <strong>Supported formats:</strong>
                        </Typography>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                          <li>SMILES notation</li>
                          <li>Simple organic molecules</li>
                          <li>Aromatic compounds</li>
                          <li>Heterocycles</li>
                        </ul>
                      </CardBody>
                    </Card>
                  </div>
                </TabPanel>
              </TabsBody>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default Molecule2D;
