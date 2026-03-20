import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

// Row component
const RecordRow = ({ record, deleteRecord }) => (
  <tr className="border-b transition-colors hover:bg-muted/50">
    <td className="p-4">{record.name}</td>
    <td className="p-4">{record.position}</td>
    <td className="p-4">{record.level}</td>
    <td className="p-4">
      <div className="flex gap-2">
        <Link
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-input bg-background hover:bg-slate-100 h-9 rounded-md px-3"
          to={`/edit/${record._id}`}
        >
          Edit
        </Link>
        <button
          type="button"
          className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium border border-input bg-background hover:bg-slate-100 hover:text-accent-foreground h-9 rounded-md px-3"
          onClick={() => deleteRecord(record._id)}
        >
          Delete
        </button>
      </div>
    </td>
  </tr>
);

export default function RecordList() {
  const [records, setRecords] = useState([]);

  // Fetch all records on component mount
  useEffect(() => {
    async function getRecords() {
      try {
        const response = await fetch("http://localhost:5050/record/");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setRecords(data);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      }
    }
    getRecords();
  }, []); // empty array → run once

  // Delete a record
  const deleteRecord = async (id) => {
    try {
      const response = await fetch(`http://localhost:5050/record/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Remove deleted record from state
      setRecords(records.filter((r) => r._id !== id));
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  return (
    <>
      <h3 className="text-lg font-semibold p-4">Employee Records</h3>
      <div className="border rounded-lg overflow-hidden">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              <tr className="border-b transition-colors hover:bg-muted/50">
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Position</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Level</th>
                <th className="h-12 px-4 text-left font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <RecordRow key={record._id} record={record} deleteRecord={deleteRecord} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}