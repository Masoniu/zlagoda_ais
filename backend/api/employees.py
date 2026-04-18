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
        sort_order: Optional[str] = Query("asc", description="Сортування (asc/desc)"),
        conn: asyncpg.Connection = Depends(get_db_conn),
        current_user: dict = Depends(get_current_user)
):
    if current_user["empl_role"] != "Менеджер":
        raise HTTPException(status_code=403, detail="Тільки Менеджер може переглядати всіх працівників")

    query = "SELECT * FROM employee WHERE 1=1"
    args = []
    if surname:
        args.append(f"%{surname}%")
        query += f" AND empl_surname ILIKE ${len(args)}"

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

    exists = await conn.fetchval("SELECT 1 FROM employee WHERE id_employee = $1", emp.id_employee)
    if exists:
        raise HTTPException(status_code=400, detail="Працівник з таким ID вже існує")
    hashed_password = get_password_hash(emp.password)

    new_emp = await conn.fetchrow("""
                                  INSERT INTO employee (id_employee, empl_surname, empl_name, empl_patronymic,
                                                        empl_role, salary, date_of_start, date_of_birth,
                                                        phone_number, city, street, zip_code, password_hash)
                                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *
                                  """, emp.id_employee, emp.empl_surname, emp.empl_name,
                                  getattr(emp, 'empl_patronymic', None),
                                  emp.empl_role, emp.salary, emp.date_of_start, emp.date_of_birth,
                                  emp.phone_number, getattr(emp, 'city', None), getattr(emp, 'street', None),
                                  getattr(emp, 'zip_code', None), hashed_password)

    return dict(new_emp)

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
            status_code=400,
            detail="Неможливо видалити працівника, оскільки він створював чеки. (Видалення заблоковано базою даних)"
        )