provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-vm-docker"
  location = "East US"
}

resource "azurerm_virtual_network" "vnet" {
  name                = "vnet-docker"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_subnet" "subnet" {
  name                 = "subnet-docker"
  resource_group_name  = azurerm_resource_group.rg.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.1.0/24"]
}

resource "azurerm_network_interface" "nic" {
  name                = "nic-docker"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name

  ip_configuration {
    name                          = "ipconfig1"
    subnet_id                     = azurerm_subnet.subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.pip.id
  }
}

resource "azurerm_public_ip" "pip" {
  name                = "pip-docker"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  allocation_method   = "Static"     # ✅ Obligatorio para SKU Standard
  sku                 = "Standard"   # ✅ Si usas Standard, esto debe estar
}

resource "azurerm_linux_virtual_machine" "vm" {
  name                = "vm-docker"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  network_interface_ids = [
    azurerm_network_interface.nic.id
  ]
  size                  = "Standard_B1s"
  admin_username        = "azureuser"
  disable_password_authentication = true

  admin_ssh_key {
    username   = "azureuser"
    public_key = file("~/.ssh/id_rsa.pub") # Usa tu clave SSH
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-focal"
    sku       = "20_04-lts-gen2"
    version   = "latest"
  }

  custom_data = base64encode(templatefile("cloud-init.yaml",{
	DEFAULT_EMAIL = var.DEFAULT_EMAIL
	VIRTUAL_HOST  = var.AGAPE_APP_HOST 
	DATABASE_URI  = var.DATABASE_URI
	AZURE_CONNECTION_STRING = var.AZURE_CONNECTION_STRING	
  }))
}
