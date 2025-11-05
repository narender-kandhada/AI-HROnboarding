import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { OrgChart } from "d3-org-chart";

export default function DepartmentChart() {
  const d3Container = useRef(null);

  useEffect(() => {
    const data = [
      { id: 1, name: "CEO", parentId: null },
      { id: 2, name: "HR Department", parentId: 1 },
      { id: 3, name: "IT Department", parentId: 1 },
      { id: 4, name: "Marketing Department", parentId: 1 },
      { id: 5, name: "Recruitment", parentId: 2 },
      { id: 6, name: "Software Team", parentId: 3 },
    ];

    if (d3Container.current) {
      const chart = new OrgChart()
        .container(d3Container.current)
        .data(data)
        .nodeWidth(() => 200)
        .nodeHeight(() => 80)
        .childrenMargin(() => 40)
        .compact(false)
        .nodeContent((d) => {
          return `
            <div style="background:#0f172a;color:white;border-radius:10px;
            padding:10px;box-shadow:0px 0px 10px rgba(0,0,0,0.2);
            text-align:center">
              <div style="font-size:16px;font-weight:bold">${d.data.name}</div>
            </div>
          `;
        })
        .render();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#D0DEEB] text-gray-800">
      <div className="bg-blue-950 text-white py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🏢 Organization Chart</h1>
      </div>
      <div ref={d3Container} className="w-full h-[80vh]" />
    </div>
  );
}
