### 🧠 Detailed Code Map

| File | Location | Logic Pattern |
| :--- | :--- | :--- |
| `App.tsx` | Line 19 | `export default function App() {` |
| `App.tsx` | Line 33 | `// const fetchData = async () => {` |
| `App.tsx` | Line 42 | `const handleLogin = async (identifier: string, secret: strin` |
| `App.tsx` | Line 68 | `const handleSignUp = async (name: string, email: string, sec` |
| `App.tsx` | Line 91 | `const handleLogout = () => {` |
| `App.tsx` | Line 97 | `const addUser = (name: string, role: Role, mobile: string, p` |
| `App.tsx` | Line 112 | `const updateUser = (userId: string, updates: Partial<User>) ` |
| `App.tsx` | Line 125 | `const deleteUser = (userId: string) => {` |
| `App.tsx` | Line 130 | `const createBatch = (batchData: Partial<Batch>) => {` |
| `App.tsx` | Line 147 | `const finalizeCut = (batchId: string, actualQty: SizeQty) =>` |
| `App.tsx` | Line 168 | `const assignToKarigar = (batchId: string, karigarId: string,` |
| `App.tsx` | Line 208 | `const updateAssignmentStatus = (batchId: string, assignmentI` |
| `App.tsx` | Line 236 | `const handleQCSubmit = (batchId: string, assignmentId: strin` |
| `App.tsx` | Line 252 | `const rework = (total as number) - passed;` |
| `App.tsx` | Line 350 | `const handleTransaction = (userId: string, amount: number, r` |
| `App.tsx` | Line 380 | `const handleArchive = (batchId: string) => {` |
| `Login.tsx` | Line 28 | `const handleSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 69 | `const handleShopifySync = () => {` |
| `ManagerDashboard.tsx` | Line 85 | `const handleImageUpload = async (e: React.ChangeEvent<HTMLIn` |
| `ManagerDashboard.tsx` | Line 116 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 130 | `const openCutModal = (batch: Batch) => {` |
| `ManagerDashboard.tsx` | Line 135 | `const handleCutSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 141 | `const openAssignModal = (batch: Batch) => {` |
| `ManagerDashboard.tsx` | Line 148 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 159 | `const openInspectModal = (item: any) => {` |
| `ManagerDashboard.tsx` | Line 165 | `const handleQCSubmit = (e: React.FormEvent) => {` |
| `ManagerDashboard.tsx` | Line 173 | `const handleQCQtyChange = (size: string, val: number) => {` |
| `ManagerDashboard.tsx` | Line 270 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `AdminDashboard.tsx` | Line 80 | `const getActiveAssignments = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 88 | `const handleShopifySync = () => {` |
| `AdminDashboard.tsx` | Line 104 | `const handleImageUpload = async (e: React.ChangeEvent<HTMLIn` |
| `AdminDashboard.tsx` | Line 130 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 144 | `const openBatchDetails = (batch: Batch) => {` |
| `AdminDashboard.tsx` | Line 149 | `const openAssignModal = () => {` |
| `AdminDashboard.tsx` | Line 157 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 166 | `const handleAddUser = async (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 183 | `const openPassbook = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 188 | `const submitPayment = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 50 | `const openCutModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 55 | `const handleCutSubmit = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 61 | `const openAssignModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 71 | `const handleSelectKarigar = (karigarId: string) => {` |
| `MasterDashboard.tsx` | Line 76 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 158 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `KarigarDashboard.tsx` | Line 53 | `const calculateTotalQty = (qty: SizeQty) => Object.values(qt` |
| `KarigarDashboard.tsx` | Line 58 | `const handlePhotoUpload = async (e: React.ChangeEvent<HTMLIn` |
| `QCDashboard.tsx` | Line 34 | `const openInspectModal = (item: any) => {` |
| `QCDashboard.tsx` | Line 40 | `const handleSubmit = (e: React.FormEvent) => {` |
| `QCDashboard.tsx` | Line 48 | `const handleQtyChange = (size: string, val: number) => {` |
| `QCDashboard.tsx` | Line 56 | `const totalPassed = (Object.values(qcForm) as number[]).redu` |
| `QCDashboard.tsx` | Line 172 | `function formatDate(dateStr?: string) {` |