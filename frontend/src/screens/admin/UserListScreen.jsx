// UserListScreen.js

import React, { useState, useEffect, useRef } from 'react';
import { Table, Button } from 'react-bootstrap';
import { FaTrash, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';
import { useDeleteUserMutation, useGetUsersQuery } from '../../slices/usersApiSlice';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Make sure to import html2canvas
import _ from 'lodash'; // Import html2canvas
import { LinkContainer } from 'react-router-bootstrap';



const UserListScreen = () => {
  const { data: users, refetch, isLoading, error } = useGetUsersQuery();
  const [deleteUser] = useDeleteUserMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const tableRef = useRef(null); // Define tableRef here

  // Define the debounced function using lodash's debounce
  const debouncedSearchTerm = _.debounce((search) => {
    setSearchTerm(search);
  }, 300);

  useEffect(() => {
    return () => {
      debouncedSearchTerm.cancel();
    };
  }, [debouncedSearchTerm]);

  const handleGeneratePDF = () => {
    if (tableRef.current) {
      const table = tableRef.current;
      html2canvas(table).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        // A4 dimensions in points are approximately 595 by 842
        const pdf = new jsPDF('p', 'pt', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        // Calculate the scaled height to maintain aspect ratio
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        // Check if the scaled height is larger than A4 height, adjust if necessary
        const finalHeight = pdfHeight > 842 ? 842 : pdfHeight;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, finalHeight);
        pdf.save('user-list.pdf');
      });
    }
  };
  

  const deleteHandler = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteUser(id);
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  return (
    <>
      <h1>Users</h1>
      <input
        type="text"
        placeholder="Search users..."
        onChange={(e) => debouncedSearchTerm(e.target.value)}
      />
            <button onClick={handleGeneratePDF}>Generate PDF</button>

      {isLoading ? (
        <p>Loading...</p>
      ) : error ? (
        <p>Error: {error?.data?.message || error.error}</p>
      ) : (
        <div ref={tableRef}> {/* Attach the ref to the table */}
          <Table striped bordered hover responsive className='table-sm'>
            <thead>
              <tr>
                <th>ID</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>ADMIN</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) =>
                  user.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((user) => (
                  <tr key={user._id}>
                    <td>{user._id}</td>
                    <td>{user.name}</td>
                    <td>
                      <a href={`mailto:${user.email}`}>{user.email}</a>
                    </td>
                    <td>
                      {user.isAdmin ? (
                        <FaCheck style={{ color: 'green' }} />
                      ) : (
                        <FaTimes style={{ color: 'red' }} />
                      )}
                    </td>
                    <td>
                      {!user.isAdmin && (
                        <>
                        <LinkContainer
                        to={`/admin/user/${user._id}/edit`}
                        style={{ marginRight: '10px' }}
                      >
                        <Button variant='light' className='btn-sm'>
                          <FaEdit />
                        </Button>
                      </LinkContainer>
                        
                          {/* <Button
                            variant='light'
                            className='btn-sm'
                            style={{ marginRight: '10px' }}
                          >
                            <FaEdit />
                          </Button> */}
                          <Button
                            variant='danger'
                            className='btn-sm'
                            onClick={() => deleteHandler(user._id)}
                          >
                            <FaTrash />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </div>
      )}
    </>
  );
};

export default UserListScreen;