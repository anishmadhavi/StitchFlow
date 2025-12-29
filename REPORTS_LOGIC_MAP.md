### 🧠 Detailed Code Map

| File | Location | Logic Pattern |
| :--- | :--- | :--- |
| `App.tsx` | Line 19 | `export default function App() {` |
| `App.tsx` | Line 33 | `// const fetchData = async () => {` |
| `App.tsx` | Line 42 | `const handleLogin = async (identifier: string, secret: strin` |
| `App.tsx` | Line 76 | `const handleSignUp = async (name: string, email: string, sec` |
| `App.tsx` | Line 99 | `const handleLogout = () => {` |
| `App.tsx` | Line 105 | `const addUser = (name: string, role: Role, mobile: string, p` |
| `App.tsx` | Line 120 | `const updateUser = (userId: string, updates: Partial<User>) ` |
| `App.tsx` | Line 133 | `const deleteUser = (userId: string) => {` |
| `App.tsx` | Line 138 | `const createBatch = (batchData: Partial<Batch>) => {` |
| `App.tsx` | Line 155 | `const finalizeCut = (batchId: string, actualQty: SizeQty) =>` |
| `App.tsx` | Line 176 | `const assignToKarigar = (batchId: string, karigarId: string,` |
| `App.tsx` | Line 216 | `const updateAssignmentStatus = (batchId: string, assignmentI` |
| `App.tsx` | Line 244 | `const handleQCSubmit = (batchId: string, assignmentId: strin` |
| `App.tsx` | Line 260 | `const rework = (total as number) - passed;` |
| `App.tsx` | Line 358 | `const handleTransaction = (userId: string, amount: number, r` |
| `App.tsx` | Line 388 | `const handleArchive = (batchId: string) => {` |
| `Login.tsx` | Line 27 | `const handleSubmit = (e: React.FormEvent) => {` |
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
| `AdminDashboard.tsx` | Line 135 | `const handleSubmitBatch = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 149 | `const openBatchDetails = (batch: Batch) => {` |
| `AdminDashboard.tsx` | Line 154 | `const openAssignModal = () => {` |
| `AdminDashboard.tsx` | Line 162 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 171 | `const handleAddUser = (e: React.FormEvent) => {` |
| `AdminDashboard.tsx` | Line 178 | `const openPassbook = (userId: string) => {` |
| `AdminDashboard.tsx` | Line 183 | `const submitPayment = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 49 | `const openCutModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 54 | `const handleCutSubmit = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 60 | `const openAssignModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 70 | `const handleSelectKarigar = (karigarId: string) => {` |
| `MasterDashboard.tsx` | Line 75 | `const handleAssignSubmit = (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 157 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `KarigarDashboard.tsx` | Line 52 | `const calculateTotalQty = (qty: SizeQty) => Object.values(qt` |
| `KarigarDashboard.tsx` | Line 57 | `const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputEle` |
| `QCDashboard.tsx` | Line 33 | `const openInspectModal = (item: any) => {` |
| `QCDashboard.tsx` | Line 39 | `const handleSubmit = (e: React.FormEvent) => {` |
| `QCDashboard.tsx` | Line 47 | `const handleQtyChange = (size: string, val: number) => {` |
| `QCDashboard.tsx` | Line 55 | `const totalPassed = (Object.values(qcForm) as number[]).redu` |
| `QCDashboard.tsx` | Line 171 | `function formatDate(dateStr?: string) {` |