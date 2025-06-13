import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Typography,
  Input,
  Button,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Spinner,
} from "@material-tailwind/react";
import { PlayIcon, BeakerIcon } from "@heroicons/react/24/outline";
import { MoleculeViewer } from "@/pages/dashboard/molecule-viewer";

export function Simulation() {
  const [activeTab, setActiveTab] = useState("predictor");

  // Predictor state
  const [smiles, setSmiles] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  // Make sure we use the same protocol (http vs https)
  const API_BASE =
    `${window.location.protocol}//152.42.134.22:5000`;

  const examples = [
    { name: "Caffeine", smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C" },
    { name: "Ibuprofen", smiles: "CC(C)CC1=CC=C(C=C1)C(C)C(=O)O" },
    { name: "Celecoxib", smiles: "CC1=CC=C(C=C1)C2=CC(=NN2C3=CC=C(C=C3)S(=O)(=O)N)C(F)(F)F" },
  ];

  async function predict() {
    const s = smiles.trim();
    if (!s) {
      setError("Please enter a SMILES string.");
      setResult(null);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const resp = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ smiles: s }),
      });
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}));
        throw new Error(body.error || `${resp.status} ${resp.statusText}`);
      }
      const data = await resp.json();
      if (data.status !== "success") {
        throw new Error("Prediction failed. Check your SMILES string.");
      }
      setResult(data);
    } catch (e) {
      console.error("Predict error:", e);
      setError(`Network/CORS error: ${e.message}`);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const colorClass = (cat) => {
    const c = cat.toLowerCase();
    if (c.includes("high")) return "text-green-600";
    if (c.includes("moderate")) return "text-yellow-600";
    if (c.includes("low")) return "text-red-600";
    return "";
  };

  return (
    <div className="mt-12">
      <Card>
        <CardHeader variant="gradient" color="blue" className="mb-4 p-6">
          <Typography variant="h5" color="white">
            <BeakerIcon className="inline w-6 h-6 mr-2 -mt-1" />
            Molecular Simulation
          </Typography>
        </CardHeader>
        <CardBody className="px-6 pb-6">
          <Tabs value={activeTab}>
            <TabsHeader>
              <Tab
                value="predictor"
                onClick={() => setActiveTab("predictor")}
              >
                Predictor
              </Tab>
              <Tab value="viewer" onClick={() => setActiveTab("viewer")}>
                Viewer
              </Tab>
            </TabsHeader>
            <TabsBody>
              <TabPanel value="predictor" className="p-0 pt-6">
                <div className="space-y-6">
                  <div>
                    <Typography variant="h6" className="mb-2">
                      Enter SMILES for Drug Sensitivity
                    </Typography>
                    <Input
                      size="lg"
                      label="SMILES string"
                      value={smiles}
                      onChange={(e) => setSmiles(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && predict()}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {examples.map((ex) => (
                      <Button
                        key={ex.name}
                        size="sm"
                        variant="outlined"
                        onClick={() => setSmiles(ex.smiles)}
                      >
                        {ex.name}
                      </Button>
                    ))}
                  </div>
                  <div>
                    <Button
                      color="blue"
                      size="md"
                      onClick={predict}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      {loading ? (
                        <Spinner className="h-5 w-5" />
                      ) : (
                        <PlayIcon className="h-5 w-5" />
                      )}
                      Predict
                    </Button>
                  </div>
                  {error && (
                    <Typography
                      variant="small"
                      color="red"
                      className="block"
                    >
                      {error}
                    </Typography>
                  )}
                  {result && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                      <Card className="p-4">
                        <Typography variant="h6">IC50</Typography>
                        <Typography variant="h4" className="mt-2">
                          {result.prediction.ic50_prediction.toFixed(3)} μM
                        </Typography>
                      </Card>
                      <Card className="p-4">
                        <Typography variant="h6">Score</Typography>
                        <Typography variant="h4" className="mt-2">
                          {result.prediction.sensitivity_score.toFixed(4)}
                        </Typography>
                      </Card>
                      <Card className="p-4">
                        <Typography variant="h6">Category</Typography>
                        <Typography
                          variant="h4"
                          className={`mt-2 ${colorClass(
                            result.prediction.sensitivity_category
                          )}`}
                        >
                          {result.prediction.sensitivity_category}
                        </Typography>
                      </Card>
                    </div>
                  )}
                </div>
              </TabPanel>
              <TabPanel value="viewer" className="p-0 pt-6">
                <MoleculeViewer />
              </TabPanel>
            </TabsBody>
          </Tabs>
        </CardBody>
      </Card>
    </div>
  );
}

export default Simulation;