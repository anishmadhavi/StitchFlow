### 🧠 Detailed Code Map

| File | Location | Logic Pattern |
| :--- | :--- | :--- |
| `App.tsx` | Line 20 | `export default function App() {` |
| `App.tsx` | Line 34 | `// const fetchData = async () => {` |
| `App.tsx` | Line 43 | `const handleLogin = async (identifier: string, secret: strin` |
| `App.tsx` | Line 69 | `const handleSignUp = async (name: string, email: string, sec` |
| `App.tsx` | Line 92 | `const handleLogout = () => {` |
| `App.tsx` | Line 98 | `const addUser = (name: string, role: Role, mobile: string, p` |
| `App.tsx` | Line 113 | `const updateUser = (userId: string, updates: Partial<User>) ` |
| `App.tsx` | Line 126 | `const deleteUser = (userId: string) => {` |
| `App.tsx` | Line 131 | `const createBatch = (batchData: Partial<Batch>) => {` |
| `App.tsx` | Line 148 | `const finalizeCut = (batchId: string, actualQty: SizeQty) =>` |
| `App.tsx` | Line 169 | `const assignToKarigar = (batchId: string, karigarId: string,` |
| `App.tsx` | Line 209 | `const updateAssignmentStatus = (batchId: string, assignmentI` |
| `App.tsx` | Line 237 | `const handleQCSubmit = (batchId: string, assignmentId: strin` |
| `App.tsx` | Line 253 | `const rework = (total as number) - passed;` |
| `App.tsx` | Line 351 | `const handleTransaction = (userId: string, amount: number, r` |
| `App.tsx` | Line 381 | `const handleArchive = (batchId: string) => {` |
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
| `MasterDashboard.tsx` | Line 55 | `const handleCutSubmit = async (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 73 | `const openAssignModal = (batch: Batch) => {` |
| `MasterDashboard.tsx` | Line 83 | `const handleSelectKarigar = (karigarId: string) => {` |
| `MasterDashboard.tsx` | Line 88 | `const handleAssignSubmit = async (e: React.FormEvent) => {` |
| `MasterDashboard.tsx` | Line 196 | `const totalAvailable = (Object.values(batch.availableQty) as` |
| `KarigarDashboard.tsx` | Line 53 | `const calculateTotalQty = (qty: SizeQty) => Object.values(qt` |
| `KarigarDashboard.tsx` | Line 58 | `const handlePhotoUpload = async (e: React.ChangeEvent<HTMLIn` |
| `QCDashboard.tsx` | Line 34 | `const openInspectModal = (item: any) => {` |
| `QCDashboard.tsx` | Line 40 | `const handleSubmit = async (e: React.FormEvent) => {` |
| `QCDashboard.tsx` | Line 74 | `const handleQtyChange = (size: string, val: number) => {` |
| `QCDashboard.tsx` | Line 82 | `const totalPassed = (Object.values(qcForm) as number[]).redu` |
| `QCDashboard.tsx` | Line 198 | `function formatDate(dateStr?: string) {` |