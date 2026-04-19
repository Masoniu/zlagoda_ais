from fastapi import APIRouter, Depends, HTTPException, status
import asyncpg
from typing import List
from fastapi import Query
from typing import Optional
from backend.core.database import get_db_conn
from backend.schemas.employee import EmployeeCreate, EmployeeResponse, EmployeeUpdate
from backend.api.dep import get_current_user
from backend.core.security import get_password_hash

router = APIRouter()


@router.get("/me", response_model=EmployeeResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.get("/", response_model=List[EmployeeResponse])
async def get_all_employees(
        surname: Optional[str] = Query(None, description="Пошук за прізвищем"),
        role: List[str] = Query(default=[]),
        sort_order: Optional[str] = Query("asc", description="Сортування (asc/desc)"),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може переглядати всіх працівників")

    if sort_order.lower() not in ["asc", "desc"]:
        sort_order = "asc"

    query = "SELECT * FROM employee WHERE 1=1"
    args = []
    if surname:
        args.append(f"%{surname}%")
        query += f" AND empl_surname ILIKE ${len(args)}"

    if role:
        args.append(role)
        query += f" AND empl_role = ANY(${len(args)}::varchar[])"

    order = "DESC" if sort_order.lower() == "desc" else "ASC"
    query += f" ORDER BY empl_surname {order}"

    result = await conn.fetch(query, *args)
    return [dict(r) for r in result]

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
        emp: EmployeeCreate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може додавати працівників")

    if emp.empl_role not in ["Менеджер", "Касир"]:
        raise HTTPException(status_code=400, detail="Роль працівника повинна бути 'Менеджер' або 'Касир'")

    hashed_password = get_password_hash(emp.password)

    try:
        new_emp = await conn.fetchrow("""
            INSERT INTO employee (id_employee, empl_surname, empl_name, empl_patronymic,
                                  empl_role, salary, date_of_start, date_of_birth,
                                  phone_number, city, street, zip_code, password_hash)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
        """, emp.id_employee, emp.empl_surname, emp.empl_name, emp.empl_patronymic,
            emp.empl_role, emp.salary, emp.date_of_start, emp.date_of_birth,
            emp.phone_number, emp.city, emp.street, emp.zip_code, hashed_password)

        return dict(new_emp)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Працівник з таким ID вже існує"
        )

@router.put("/{id_employee}", response_model=EmployeeResponse)
async def update_employee(
        id_employee: str,
        emp_data: EmployeeUpdate,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може оновлювати працівників")

    provided_fields = emp_data.model_dump(exclude_unset=True)
    
    if not provided_fields:
        raise HTTPException(status_code=400, detail="Не надано жодних полів для оновлення")

    if 'empl_role' in provided_fields:
        if emp_data.empl_role not in ["Менеджер", "Касир"]:
            raise HTTPException(status_code=400, detail="Роль працівника повинна бути 'Менеджер' або 'Касир'")
    
    try:
        update_fields = []
        update_values = []
        
        if 'empl_surname' in provided_fields:
            update_fields.append(f"empl_surname = ${len(update_values) + 1}")
            update_values.append(emp_data.empl_surname)
        
        if 'empl_name' in provided_fields:
            update_fields.append(f"empl_name = ${len(update_values) + 1}")
            update_values.append(emp_data.empl_name)
        
        if 'empl_patronymic' in provided_fields:
            update_fields.append(f"empl_patronymic = ${len(update_values) + 1}")
            update_values.append(emp_data.empl_patronymic)
        
        if 'empl_role' in provided_fields:
            update_fields.append(f"empl_role = ${len(update_values) + 1}")
            update_values.append(emp_data.empl_role)
        
        if 'salary' in provided_fields:
            update_fields.append(f"salary = ${len(update_values) + 1}")
            update_values.append(emp_data.salary)
        
        if 'date_of_start' in provided_fields:
            update_fields.append(f"date_of_start = ${len(update_values) + 1}")
            update_values.append(emp_data.date_of_start)
        
        if 'date_of_birth' in provided_fields:
            update_fields.append(f"date_of_birth = ${len(update_values) + 1}")
            update_values.append(emp_data.date_of_birth)
        
        if 'phone_number' in provided_fields:
            update_fields.append(f"phone_number = ${len(update_values) + 1}")
            update_values.append(emp_data.phone_number)
        
        if 'city' in provided_fields:
            update_fields.append(f"city = ${len(update_values) + 1}")
            update_values.append(emp_data.city)
        
        if 'street' in provided_fields:
            update_fields.append(f"street = ${len(update_values) + 1}")
            update_values.append(emp_data.street)
        
        if 'zip_code' in provided_fields:
            update_fields.append(f"zip_code = ${len(update_values) + 1}")
            update_values.append(emp_data.zip_code)
        
        update_values.append(id_employee)
        query = f"UPDATE employee SET {', '.join(update_fields)} WHERE id_employee = ${len(update_values)} RETURNING *"
        
        updated_emp = await conn.fetchrow(query, *update_values)

        if not updated_emp:
            raise HTTPException(status_code=404, detail="Працівника не знайдено")

        return dict(updated_emp)
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Працівник з таким ID вже існує"
        )


@router.delete("/{id_employee}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
        id_employee: str,
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може звільняти працівників")

    try:
        result = await conn.fetchval("DELETE FROM employee WHERE id_employee = $1 RETURNING id_employee", id_employee)
        if not result:
            raise HTTPException(status_code=404, detail="Працівника не знайдено")
        return None
    except asyncpg.exceptions.ForeignKeyViolationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Неможливо видалити цього працівника, оскільки він створював чеки. Спочатку перепризначте його чеки іншому працівнику."
        )