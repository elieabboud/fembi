import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  CircularProgress,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AppTable from '../components/common/AppTable';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import { Contact } from '../types/contact';

// Sample contacts data
const sampleContacts: Contact[] = [
  {
    id: '1',
    name: 'Angelique Morse',
    email: 'benny89@yahoo.com',
    phoneNumber: '+46 8 123 456',
    company: 'Wuckert Inc',
    role: 'Content Creator',
    status: 'Banned',
  },
  {
    id: '2',
    name: 'Ariana Lang',
    email: 'avery43@hotmail.com',
    phoneNumber: '+54 11 1234-5678',
    company: 'Feest Group',
    role: 'IT Administrator',
    status: 'Pending',
  },
  {
    id: '3',
    name: 'Aspen Schmitt',
    email: 'mireya13@hotmail.com',
    phoneNumber: '+34 91 123 4567',
    company: 'Kihn, Marquardt and Crist',
    role: 'Financial Planner',
    status: 'Banned',
  },
  {
    id: '4',
    name: 'Brycen Jimenez',
    email: 'tyrel.greenbelt@gmail.com',
    phoneNumber: '+52 55 1234 5678',
    company: 'Rempel, Hand and Herzog',
    role: 'HR Recruiter',
    status: 'Active',
  },
  {
    id: '5',
    name: 'Chase Day',
    email: 'joana.simonts84@gmail.com',
    phoneNumber: '+86 10 1234 5678',
    company: 'Mraz, Donnelly and Collins',
    role: 'Graphic Designer',
    status: 'Banned',
  },
];

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => {
  return (
    <div role="tabpanel" hidden={value !== index} id={`contact-tabpanel-${index}`}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const Contacts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // Table columns
  const columns = [
    { 
      id: 'name', 
      label: 'Name',
      format: (value: string, row: Contact) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar 
            sx={{ width: 32, height: 32, mr: 2 }}
            alt={value}
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(value)}&background=random`}
          />
          <Box>
            <Typography variant="body2">{value}</Typography>
            <Typography variant="caption" color="text.secondary">{row.email}</Typography>
          </Box>
        </Box>
      )
    },
    { id: 'phoneNumber', label: 'Phone number' },
    { id: 'company', label: 'Company' },
    { id: 'role', label: 'Role' },
    { 
      id: 'status', 
      label: 'Status',
      format: (value: string) => <StatusBadge status={value as any} />
    },
  ];

  // Load contacts data
  useEffect(() => {
    const loadContacts = async () => {
      try {
        setLoading(true);
        // Simulating API call
        await new Promise(resolve => setTimeout(resolve, 500));
        setContacts(sampleContacts);
        setFilteredContacts(sampleContacts);
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
  }, []);

  // Filter contacts based on tab and search query
  useEffect(() => {
    let filtered = [...contacts];
    
    // Filter by status tab
    if (tabValue === 1) {
      filtered = filtered.filter(contact => contact.status === 'Active');
    } else if (tabValue === 2) {
      filtered = filtered.filter(contact => contact.status === 'Pending');
    } else if (tabValue === 3) {
      filtered = filtered.filter(contact => contact.status === 'Banned');
    } else if (tabValue === 4) {
      filtered = filtered.filter(contact => contact.status === 'Rejected');
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.email.toLowerCase().includes(query) ||
          contact.company.toLowerCase().includes(query) ||
          contact.role.toLowerCase().includes(query)
      );
    }
    
    setFilteredContacts(filtered);
  }, [contacts, tabValue, searchQuery]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleActionClick = (contact: Contact) => (event: React.MouseEvent<HTMLButtonElement>) => {
    setSelectedContact(contact);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
  };

  const getTabCount = (status: Contact['status']) => {
    return contacts.filter(contact => contact.status === status).length;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Contacts
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
        >
          Add Contact
        </Button>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        indicatorColor="primary"
        textColor="primary"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label={`All (${contacts.length})`} />
        <Tab label={`Active (${getTabCount('Active')})`} />
        <Tab label={`Pending (${getTabCount('Pending')})`} />
        <Tab label={`Banned (${getTabCount('Banned')})`} />
        <Tab label={`Rejected (${getTabCount('Rejected')})`} />
      </Tabs>

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <SearchBar
          placeholder="Search..."
          value={searchQuery}
          onChange={handleSearch}
        />
      </Box>

      <TabPanel value={tabValue} index={0}>
        <AppTable
          columns={columns}
          rows={filteredContacts}
          showActions
          onActionClick={handleActionClick}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        <AppTable
          columns={columns}
          rows={filteredContacts}
          showActions
          onActionClick={handleActionClick}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <AppTable
          columns={columns}
          rows={filteredContacts}
          showActions
          onActionClick={handleActionClick}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={3}>
        <AppTable
          columns={columns}
          rows={filteredContacts}
          showActions
          onActionClick={handleActionClick}
        />
      </TabPanel>
      <TabPanel value={tabValue} index={4}>
        <AppTable
          columns={columns}
          rows={filteredContacts}
          showActions
          onActionClick={handleActionClick}
        />
      </TabPanel>

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
      >
        <MenuItem onClick={handleCloseActionMenu}>Edit</MenuItem>
        <MenuItem onClick={handleCloseActionMenu}>View Details</MenuItem>
        <MenuItem onClick={handleCloseActionMenu} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Contacts;